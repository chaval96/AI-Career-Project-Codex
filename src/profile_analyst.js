const TITLE_MAP = {
  'swe ii': 'Software Developer',
  'software engineer ii': 'Software Developer',
  'frontend engineer': 'Frontend Developer',
  'backend engineer': 'Backend Developer'
};

export function normalizeRoleTitle(title) {
  const key = String(title ?? '').trim().toLowerCase();
  return TITLE_MAP[key] ?? String(title ?? '').trim();
}

export function suggestCanonicalRole(entry) {
  const title = normalizeRoleTitle(entry?.role_title ?? '');
  const normalized = title.toLowerCase();

  if (normalized.includes('data')) {
    return { canonical_role_id: 'data_scientist', mapping_confidence: 0.74 };
  }
  if (normalized.includes('frontend') || normalized.includes('web')) {
    return { canonical_role_id: '15-1254.00', mapping_confidence: 0.78 };
  }
  return { canonical_role_id: '15-1252.00', mapping_confidence: 0.82 };
}

export function analyzeResumeItems(items) {
  return items.map((item) => {
    const mapping = suggestCanonicalRole(item);
    return {
      ...item,
      role_title: normalizeRoleTitle(item.role_title),
      canonical_role_id: mapping.canonical_role_id,
      mapping_confidence: mapping.mapping_confidence
    };
  });
}
