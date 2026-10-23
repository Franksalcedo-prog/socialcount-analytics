export interface CsvCommentRow {
  platform: string;
  accountName: string;
  postId: string;
  externalCommentId: string;
  authorName: string;
  text: string;
  commentDate: string;
  isReply: string;
  status: string;
}

export function generateCommentsCsv(rows: CsvCommentRow[]): string {
  // UTF-8 BOM to ensure proper accent rendering in Excel
  const BOM = '\uFEFF';

  const headers = [
    'Plataforma',
    'Cuenta / Página',
    'ID Publicación',
    'ID Comentario Meta',
    'Autor',
    'Texto del Comentario',
    'Fecha de Creación',
    'Es Respuesta',
    'Estado',
  ];

  const escapeField = (val: string | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvLines = [headers.join(',')];

  for (const row of rows) {
    const line = [
      escapeField(row.platform),
      escapeField(row.accountName),
      escapeField(row.postId),
      escapeField(row.externalCommentId),
      escapeField(row.authorName),
      escapeField(row.text),
      escapeField(row.commentDate),
      escapeField(row.isReply),
      escapeField(row.status),
    ].join(',');
    csvLines.push(line);
  }

  return BOM + csvLines.join('\r\n');
}
