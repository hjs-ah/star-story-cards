export const config = { runtime: "edge" };

export default async function handler(req) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set in Vercel environment." }), {
      status: 500, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const { story } = await req.json();

  const prompt = `You are an interview coach. A candidate has the following STAR-format story:

TITLE: ${story.title}
ROLE/CONTEXT: ${story.context || ""}
SITUATION: ${story.situation || ""}
TASK: ${story.task || ""}
ACTION: ${story.action || ""}
RESULT: ${story.result || ""}

Extract the most compelling keywords, phrases, and specific metrics an interviewer would respond to. Focus on:
1. POWER WORDS — strong action verbs or leadership language from this story
2. KEY METRICS — specific numbers, percentages, dollar amounts, ratios, timelines
3. INTERVIEW PHRASES — 1–2 sentence soundbites worth memorizing verbatim

Return ONLY valid JSON in this exact shape, no markdown, no commentary:
{
  "powerWords": ["word1", "word2", "word3", "word4", "word5"],
  "metrics": ["metric1", "metric2", "metric3"],
  "phrases": ["phrase1", "phrase2"]
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return new Response(JSON.stringify({ error: data.error?.message || "Haiku API error" }), {
      status: res.status, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const text = data.content?.[0]?.text || "{}";
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Could not parse suggestions." }), {
      status: 500, headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}
