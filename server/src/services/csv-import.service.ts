import { prisma } from '../db/prisma.js';

export interface CsvImportRow {
  platform?: string;
  text: string;
  authorName?: string;
  authorExternalId?: string;
  commentDate?: string;
  externalId?: string;
  isReply?: boolean;
}

export interface CsvImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  duplicates: number;
  errors: string[];
}

export class CsvImportService {
  /**
   * Parsea un archivo CSV en filas de comentarios estructuradas
   */
  public parseCsv(csvContent: string): CsvImportRow[] {
    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('El archivo CSV debe contener una fila de encabezados y al menos una fila de datos.');
    }

    const headers = this.parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/['"]/g, ''));
    const rows: CsvImportRow[] = [];

    // Mapeo flexible de encabezados
    const textIdx = headers.findIndex((h) => ['texto', 'text', 'comentario', 'comment', 'contenido', 'message'].includes(h));
    const authorIdx = headers.findIndex((h) => ['autor', 'author', 'usuario', 'user', 'authorname', 'nombre'].includes(h));
    const platformIdx = headers.findIndex((h) => ['plataforma', 'platform', 'red', 'red_social'].includes(h));
    const dateIdx = headers.findIndex((h) => ['fecha', 'date', 'timestamp', 'commentdate', 'creado'].includes(h));
    const idIdx = headers.findIndex((h) => ['id', 'externalid', 'comment_id', 'id_comentario'].includes(h));

    if (textIdx === -1) {
      throw new Error('No se encontró una columna requerida para el texto del comentario (ej. "texto", "comentario", "text").');
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = this.parseCsvLine(line);
      if (cols.length <= textIdx) continue;

      const text = cols[textIdx]?.trim();
      if (!text) continue;

      const authorName = authorIdx !== -1 && cols[authorIdx] ? cols[authorIdx].trim() : 'Usuario Anónimo';
      let platform = platformIdx !== -1 && cols[platformIdx] ? cols[platformIdx].trim().toUpperCase() : 'FACEBOOK';
      if (!['FACEBOOK', 'INSTAGRAM'].includes(platform)) {
        platform = platform.includes('INSTA') || platform.includes('IG') ? 'INSTAGRAM' : 'FACEBOOK';
      }

      const commentDate = dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx].trim() : new Date().toISOString();
      const externalId = idIdx !== -1 && cols[idIdx] ? cols[idIdx].trim() : `csv_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`;

      rows.push({
        platform,
        text,
        authorName,
        commentDate,
        externalId,
      });
    }

    return rows;
  }

  /**
   * Importa filas de comentarios a una publicación o categoría determinada
   */
  public async importComments(
    rows: CsvImportRow[],
    options: {
      postId: string;
      socialAccountId: string;
    }
  ): Promise<CsvImportResult> {
    let imported = 0;
    let duplicates = 0;
    const errors: string[] = [];

    const post = await prisma.socialPost.findUnique({
      where: { id: options.postId },
    });

    if (!post) {
      throw new Error(`Publicación de destino no encontrada (${options.postId})`);
    }

    for (const row of rows) {
      try {
        const platform = (row.platform || post.platform).toUpperCase();
        const externalId = row.externalId || `csv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        const existing = await prisma.socialComment.findUnique({
          where: {
            platform_externalId: {
              platform,
              externalId,
            },
          },
        });

        if (existing) {
          duplicates++;
          continue;
        }

        const date = row.commentDate ? new Date(row.commentDate) : new Date();
        const validDate = isNaN(date.getTime()) ? new Date() : date;

        await prisma.socialComment.create({
          data: {
            postId: post.id,
            socialAccountId: options.socialAccountId,
            platform,
            externalId,
            authorName: row.authorName || 'Usuario CSV',
            text: row.text,
            commentDate: validDate,
            isReply: row.isReply || false,
            status: 'VERIFIED',
          },
        });

        imported++;
      } catch (err: any) {
        errors.push(`Error en fila "${row.text?.substring(0, 30)}...": ${err.message}`);
      }
    }

    // Actualizar conteo en el post
    const currentTotal = await prisma.socialComment.count({ where: { postId: post.id } });
    await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        totalStoredComments: currentTotal,
      },
    });

    return {
      success: errors.length === 0 || imported > 0,
      totalRows: rows.length,
      imported,
      duplicates,
      errors,
    };
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  }
}

export const csvImportService = new CsvImportService();
