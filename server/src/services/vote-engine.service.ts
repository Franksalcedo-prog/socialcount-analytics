import crypto from 'node:crypto';
import { prisma } from '../db/prisma.js';

export interface VoteAnalysisResult {
  categoryId: string;
  categoryName: string;
  categoryStatus: 'PROVISIONAL' | 'DEFINITIVE';
  votingPolicy: string;
  totalCommentsAnalyzed: number;
  totalValidVotes: number;
  totalDiscardedComments: number;
  totalRepeatedComments: number;
  totalFacebookVotes: number;
  totalInstagramVotes: number;
  leader: {
    id: string;
    name: string;
    totalVotes: number;
    photoUrl?: string | null;
  } | null;
  candidatesRanking: Array<{
    id: string;
    name: string;
    number: number | null;
    photoUrl: string | null;
    bio: string | null;
    status: string;
    facebookVotes: number;
    instagramVotes: number;
    totalVotes: number;
    percentage: number;
    rank: number;
    differenceFromLeader: number;
    isWinner: boolean;
  }>;
  repeatedCommentsSummary: Array<{
    text: string;
    frequency: number;
    candidateName: string | null;
    status: string;
  }>;
  discardReasonsSummary: Record<string, number>;
}

export class VoteEngineService {
  /**
   * Normaliza una cadena de texto eliminando tildes, signos y dobles espacios
   */
  public normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos/diacríticos
      .replace(/[^\w\s#@]/g, ' ') // Mantener letras, números, hashtags y arrobas
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Genera un hash seguro del texto normalizado para agrupamiento rápido
   */
  public generateTextHash(normalizedText: string): string {
    return crypto.createHash('md5').update(normalizedText).digest('hex');
  }

  /**
   * Detecta qué candidato coincide con el texto del comentario
   */
  public matchCandidate(
    normalizedText: string,
    candidates: Array<{ id: string; name: string; number: number | null; aliasList: string }>
  ): { matchedCandidateId: string | null; isMultiMention: boolean; matchedCandidates: string[] } {
    const matched: string[] = [];

    for (const candidate of candidates) {
      const aliases: string[] = [];
      try {
        const parsed = JSON.parse(candidate.aliasList || '[]');
        if (Array.isArray(parsed)) {
          aliases.push(...parsed);
        }
      } catch {
        // Fallback si no es JSON válido
      }

      // Nombre completo y palabras del nombre
      aliases.push(candidate.name);
      if (candidate.number !== null && candidate.number !== undefined) {
        aliases.push(`#${candidate.number}`, `numero ${candidate.number}`, `candidata ${candidate.number}`, `participante ${candidate.number}`);
      }

      // Verificar coincidencias en el texto normalizado
      let hasMatch = false;
      for (const alias of aliases) {
        const normAlias = this.normalizeText(alias);
        if (!normAlias || normAlias.length < 2) continue;

        // Búsqueda por palabra completa o hashtag/mención exacta
        const regex = new RegExp(`(^|\\s)${normAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i');
        if (regex.test(normalizedText) || normalizedText.includes(normAlias)) {
          hasMatch = true;
          break;
        }
      }

      if (hasMatch) {
        matched.push(candidate.id);
      }
    }

    if (matched.length === 1) {
      return { matchedCandidateId: matched[0], isMultiMention: false, matchedCandidates: matched };
    } else if (matched.length > 1) {
      return { matchedCandidateId: null, isMultiMention: true, matchedCandidates: matched };
    }

    return { matchedCandidateId: null, isMultiMention: false, matchedCandidates: [] };
  }

  /**
   * Procesa y reclasifica todos los comentarios vinculados a una categoría
   */
  public async processCategoryVotes(categoryId: string): Promise<VoteAnalysisResult> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        candidates: true,
        posts: {
          include: {
            comments: {
              orderBy: { commentDate: 'asc' }, // Orden cronológico estricto
            },
          },
        },
      },
    });

    if (!category) {
      throw new Error(`Categoría no encontrada con ID ${categoryId}`);
    }

    // Obtener todos los comentarios de las publicaciones de la categoría
    const allComments = category.posts.flatMap((p) => p.comments);

    // Mapeo para tracking de votantes según política
    // Map: authorKey -> Set(candidateId)
    const userVotesPerCandidate = new Map<string, Set<string>>();
    // Set: authorKey (para ONE_PER_USER_PER_CATEGORY)
    const usersVotedInCategory = new Set<string>();

    // Tracking de frecuencias de textos idénticos
    const textHashCount = new Map<string, number>();
    for (const c of allComments) {
      const norm = this.normalizeText(c.text);
      const hash = this.generateTextHash(norm);
      textHashCount.set(hash, (textHashCount.get(hash) || 0) + 1);
    }

    // Procesar cada comentario y crear/actualizar VoteRecord
    for (const comment of allComments) {
      const normalizedText = this.normalizeText(comment.text);
      const textHash = this.generateTextHash(normalizedText);
      const authorKey = comment.authorExternalId || comment.authorName || comment.id;

      // Buscar si ya existe un VoteRecord
      const existingRecord = await prisma.voteRecord.findUnique({
        where: { commentId: comment.id },
      });

      // Si fue aprobado o rechazado manualmente, respetamos la auditoría humana
      if (existingRecord && (existingRecord.voteStatus === 'MANUALLY_APPROVED' || existingRecord.voteStatus === 'MANUALLY_REJECTED')) {
        continue;
      }

      // 1. Identificar candidato
      const { matchedCandidateId, isMultiMention } = this.matchCandidate(normalizedText, category.candidates);

      let voteStatus = 'VALID';
      let discardReason: string | null = null;
      let candidateIdToAssign: string | null = matchedCandidateId;

      if (!matchedCandidateId && !isMultiMention) {
        voteStatus = 'NO_CANDIDATE_MATCH';
        discardReason = 'El comentario no menciona ningún nombre, hashtag ni alias de participante registrado.';
      } else if (isMultiMention) {
        if (!category.allowMultipleMentions) {
          voteStatus = 'MULTI_MENTION';
          discardReason = 'Comentario ambiguo: menciona a múltiples participantes en una misma publicación.';
        } else {
          voteStatus = 'PENDING_REVIEW';
          discardReason = 'Mención múltiple requiere confirmación manual del juez de conteo.';
        }
      } else if (matchedCandidateId) {
        // 2. Aplicar Políticas de Conteo
        if (category.votingPolicy === 'ONE_PER_USER_PER_CATEGORY') {
          if (usersVotedInCategory.has(authorKey)) {
            voteStatus = 'DUPLICATE_USER';
            discardReason = 'El usuario ya emitió su voto único permitido en esta categoría.';
          } else {
            usersVotedInCategory.add(authorKey);
          }
        } else if (category.votingPolicy === 'ONE_PER_USER_AND_CANDIDATE') {
          const votedCandidates = userVotesPerCandidate.get(authorKey) || new Set<string>();
          if (votedCandidates.has(matchedCandidateId)) {
            voteStatus = 'DUPLICATE_USER';
            discardReason = 'El usuario ya emitió un voto válido para este integrante.';
          } else {
            votedCandidates.add(matchedCandidateId);
            userVotesPerCandidate.set(authorKey, votedCandidates);
          }
        } else {
          // EVERY_VALID_COMMENT: Voto válido permitido siempre que no sea spam excesivo
        }
      }

      // Guardar o actualizar registro de voto
      await prisma.voteRecord.upsert({
        where: { commentId: comment.id },
        create: {
          commentId: comment.id,
          candidateId: candidateIdToAssign,
          normalizedText,
          textHash,
          voteStatus,
          discardReason,
        },
        update: {
          candidateId: candidateIdToAssign,
          normalizedText,
          textHash,
          voteStatus,
          discardReason,
        },
      });
    }

    return this.getCategoryResults(categoryId);
  }

  /**
   * Obtiene los resultados oficiales consolidados por categoría
   */
  public async getCategoryResults(categoryId: string): Promise<VoteAnalysisResult> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        candidates: {
          include: {
            voteRecords: {
              include: {
                comment: true,
              },
            },
          },
        },
        posts: {
          include: {
            comments: {
              include: {
                voteRecord: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new Error(`Categoría no encontrada con ID ${categoryId}`);
    }

    const allComments = category.posts.flatMap((p) => p.comments);
    const totalCommentsAnalyzed = allComments.length;

    let totalValidVotes = 0;
    let totalDiscardedComments = 0;
    let totalFacebookVotes = 0;
    let totalInstagramVotes = 0;

    const discardReasonsSummary: Record<string, number> = {};
    const textFrequencyMap = new Map<string, { text: string; frequency: number; candidateName: string | null; status: string }>();

    for (const c of allComments) {
      const vr = c.voteRecord;
      if (!vr) continue;

      const norm = vr.normalizedText || c.text;
      const prev = textFrequencyMap.get(vr.textHash) || { text: norm, frequency: 0, candidateName: null, status: vr.voteStatus };
      prev.frequency += 1;
      textFrequencyMap.set(vr.textHash, prev);

      if (vr.voteStatus === 'VALID' || vr.voteStatus === 'MANUALLY_APPROVED') {
        totalValidVotes += 1;
        if (c.platform === 'FACEBOOK') totalFacebookVotes += 1;
        if (c.platform === 'INSTAGRAM') totalInstagramVotes += 1;
      } else {
        totalDiscardedComments += 1;
        const reasonKey = vr.discardReason || vr.voteStatus;
        discardReasonsSummary[reasonKey] = (discardReasonsSummary[reasonKey] || 0) + 1;
      }
    }

    // Calcular estadísticas por candidato
    const candidatesRanking = category.candidates.map((cand) => {
      let fbVotes = 0;
      let igVotes = 0;

      for (const vr of cand.voteRecords) {
        if (vr.voteStatus === 'VALID' || vr.voteStatus === 'MANUALLY_APPROVED') {
          if (vr.comment.platform === 'FACEBOOK') fbVotes += 1;
          if (vr.comment.platform === 'INSTAGRAM') igVotes += 1;
        }
      }

      const totalVotes = fbVotes + igVotes;
      const percentage = totalValidVotes > 0 ? Math.round((totalVotes / totalValidVotes) * 1000) / 10 : 0;

      return {
        id: cand.id,
        name: cand.name,
        number: cand.number,
        photoUrl: cand.photoUrl,
        bio: cand.bio,
        status: cand.status,
        facebookVotes: fbVotes,
        instagramVotes: igVotes,
        totalVotes,
        percentage,
        rank: 1, // Se asigna luego del ordenamiento
        differenceFromLeader: 0,
        isWinner: false,
      };
    });

    // Ordenar de mayor a menor número de votos
    candidatesRanking.sort((a, b) => b.totalVotes - a.totalVotes);

    const leaderVotes = candidatesRanking.length > 0 ? candidatesRanking[0].totalVotes : 0;

    candidatesRanking.forEach((cand, idx) => {
      cand.rank = idx + 1;
      cand.differenceFromLeader = leaderVotes - cand.totalVotes;
      cand.isWinner = idx === 0 && cand.totalVotes > 0;
    });

    const leader = candidatesRanking.length > 0 && candidatesRanking[0].totalVotes > 0
      ? {
          id: candidatesRanking[0].id,
          name: candidatesRanking[0].name,
          totalVotes: candidatesRanking[0].totalVotes,
          photoUrl: candidatesRanking[0].photoUrl,
        }
      : null;

    // Obtener los comentarios repetidos más frecuentes (frecuencia > 1)
    const repeatedCommentsSummary = Array.from(textFrequencyMap.values())
      .filter((t) => t.frequency > 1)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    const totalRepeatedComments = repeatedCommentsSummary.reduce((acc, curr) => acc + (curr.frequency - 1), 0);

    return {
      categoryId: category.id,
      categoryName: category.name,
      categoryStatus: category.status as 'PROVISIONAL' | 'DEFINITIVE',
      votingPolicy: category.votingPolicy,
      totalCommentsAnalyzed,
      totalValidVotes,
      totalDiscardedComments,
      totalRepeatedComments,
      totalFacebookVotes,
      totalInstagramVotes,
      leader,
      candidatesRanking,
      repeatedCommentsSummary,
      discardReasonsSummary,
    };
  }

  /**
   * Auditoría manual: permite cambiar el estado de un voto o asignarlo a otro candidato
   */
  public async auditVoteRecord(
    voteRecordId: string,
    params: {
      newStatus: string;
      newCandidateId?: string | null;
      changedBy: string;
      reason: string;
    }
  ): Promise<any> {
    const existing = await prisma.voteRecord.findUnique({
      where: { id: voteRecordId },
    });

    if (!existing) {
      throw new Error('Registro de voto no encontrado.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.voteRecord.update({
        where: { id: voteRecordId },
        data: {
          voteStatus: params.newStatus,
          candidateId: params.newCandidateId !== undefined ? params.newCandidateId : existing.candidateId,
          manualNotes: params.reason,
          reviewedBy: params.changedBy,
          reviewedAt: new Date(),
        },
      });

      await tx.voteAuditLog.create({
        data: {
          voteRecordId,
          previousStatus: existing.voteStatus,
          newStatus: params.newStatus,
          previousCandidateId: existing.candidateId,
          newCandidateId: params.newCandidateId !== undefined ? params.newCandidateId : existing.candidateId,
          changedBy: params.changedBy,
          reason: params.reason,
        },
      });

      return record;
    });

    return updated;
  }
}

export const voteEngineService = new VoteEngineService();
