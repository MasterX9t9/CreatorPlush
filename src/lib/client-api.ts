/**
 * Client-Side API Helper with BYOK (Bring Your Own Key) Header Injection
 */

export function getClientApiHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (typeof window !== "undefined") {
    try {
      const ytKey = localStorage.getItem("cp_user_youtube_key");
      if (ytKey && ytKey.trim()) {
        headers["x-youtube-api-key"] = ytKey.trim();
      }

      const geminiKey = localStorage.getItem("cp_user_gemini_key");
      if (geminiKey && geminiKey.trim()) {
        headers["x-gemini-api-key"] = geminiKey.trim();
      }

      const openaiKey = localStorage.getItem("cp_user_openai_key");
      if (openaiKey && openaiKey.trim()) {
        headers["x-openai-api-key"] = openaiKey.trim();
      }
    } catch {
      // localStorage may fail in private browsing mode
    }
  }

  return headers;
}

export async function clientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const mergedHeaders = getClientApiHeaders((init?.headers as Record<string, string>) || {});
  return fetch(input, {
    ...init,
    headers: mergedHeaders,
  });
}
