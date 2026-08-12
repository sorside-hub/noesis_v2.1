/**
 * Helper to retrieve all available Gemini API Keys in pairs.
 */
export function getGeminiApiKeys(env?: Record<string, any>): {
  pair1: { primary: string | null; backup: string | null };
  pair2: { primary: string | null; backup: string | null };
} {
  const getEnv = (key: string) =>
    env?.[key] || (typeof process !== 'undefined' ? process.env?.[key] : '');

  return {
    pair1: {
      primary: getEnv('GEMINI_KEY_1_PRIMARY') || getEnv('GEMINI_API_KEY') || null,
      backup: getEnv('GEMINI_KEY_1_BACKUP') || getEnv('GEMINI_API_KEY_SECONDARY') || getEnv('GEMINI_API_KEY_BACKUP') || null,
    },
    pair2: {
      primary: getEnv('GEMINI_KEY_2_PRIMARY') || null,
      backup: getEnv('GEMINI_KEY_2_BACKUP') || null,
    },
  };
}
