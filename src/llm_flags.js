export function isLlmEnabled() {
  return String(process.env.LLM_ENABLED ?? 'false').toLowerCase() === 'true';
}
