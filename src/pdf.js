function escapePdfText(value) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildXref(offsets) {
  const rows = ['0000000000 65535 f '];
  for (const offset of offsets) {
    rows.push(`${String(offset).padStart(10, '0')} 00000 n `);
  }
  return rows.join('\n');
}

export function createMinimalPdf(text) {
  const safeText = escapePdfText(text);
  const stream = `BT\n/F1 18 Tf\n50 740 Td\n(${safeText}) Tj\nET`;

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  ];

  const header = '%PDF-1.4\n';
  let body = '';
  const offsets = [];
  let currentOffset = header.length;

  for (const object of objects) {
    offsets.push(currentOffset);
    body += object;
    currentOffset += object.length;
  }

  const xrefStart = currentOffset;
  const xref = `xref\n0 ${objects.length + 1}\n${buildXref(offsets)}\n`;
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(header + body + xref + trailer, 'utf8');
}
