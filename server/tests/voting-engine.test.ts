import { describe, it, expect } from 'vitest';
import { VoteEngineService } from '../src/services/vote-engine.service.js';

describe('VoteEngineService - Normalización, Matching y Políticas', () => {
  const service = new VoteEngineService();

  it('debe normalizar textos eliminando tildes, signos y mayúsculas', () => {
    const raw = '¡¡Voto por Válèntiná Córdobá!! #1...';
    const normalized = service.normalizeText(raw);
    expect(normalized).toBe('voto por valentina cordoba #1');
  });

  it('debe generar el mismo hash para comentarios con texto equivalente', () => {
    const text1 = service.normalizeText('Valentina Córdoba #1');
    const text2 = service.normalizeText('   valentina cordoba  #1   ');
    expect(service.generateTextHash(text1)).toBe(service.generateTextHash(text2));
  });

  it('debe identificar al candidato por nombre, número o hashtag de alias', () => {
    const candidates = [
      { id: 'c1', name: 'Valentina Córdoba', number: 1, aliasList: JSON.stringify(['#valentina', '@valentina_cordoba']) },
      { id: 'c2', name: 'Isabella Mina', number: 2, aliasList: JSON.stringify(['#isabella', '@isabella_mina']) },
    ];

    const match1 = service.matchCandidate(service.normalizeText('Mi voto seguro es #valentina'), candidates);
    expect(match1.matchedCandidateId).toBe('c1');
    expect(match1.isMultiMention).toBe(false);

    const match2 = service.matchCandidate(service.normalizeText('Candidata 2 tiene mi apoyo'), candidates);
    expect(match2.matchedCandidateId).toBe('c2');
    expect(match2.isMultiMention).toBe(false);
  });

  it('debe detectar multi-mención cuando se nombra a dos o más candidatos', () => {
    const candidates = [
      { id: 'c1', name: 'Valentina Córdoba', number: 1, aliasList: JSON.stringify(['#valentina']) },
      { id: 'c2', name: 'Isabella Mina', number: 2, aliasList: JSON.stringify(['#isabella']) },
    ];

    const match = service.matchCandidate(service.normalizeText('Me gustan tanto Valentina Córdoba como Isabella Mina'), candidates);
    expect(match.matchedCandidateId).toBe(null);
    expect(match.isMultiMention).toBe(true);
    expect(match.matchedCandidates).toHaveLength(2);
  });

  it('debe manejar casos sin coincidencia de candidato', () => {
    const candidates = [
      { id: 'c1', name: 'Valentina Córdoba', number: 1, aliasList: JSON.stringify(['#valentina']) },
    ];

    const match = service.matchCandidate(service.normalizeText('Excelente publicación amigos'), candidates);
    expect(match.matchedCandidateId).toBe(null);
    expect(match.isMultiMention).toBe(false);
  });
});
