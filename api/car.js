export const config = { runtime: "edge" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const CA2R_SYSTEM_PROMPT = `You are an expert interview coach helping a senior professional craft high-impact interview stories using the CA²R methodology. Your job is to BOTH restructure AND coach.

THE CA²R FRAMEWORK:
CA²R stands for: Context → Approach¹ → Approach² → Result

1. CONTEXT (Why this story matters):
   - Explain WHY the story matters — goals, problems (not itty-bitty details)
   - Prime the result upfront — foreshadow the outcome to create anticipation
   - Think "above yourself" — how does this fit into the bigger picture?
   - Position yourself AT CENTER — everything happens "around you"
   - Explain WHY you were selected and how you were involved
   - Give the interviewer HEFT, importance, gravitas — elevate your position
   - Moves their emotional state to where YOU want it

2. APPROACH¹ (System/Framework — race through it):
   - Explain your framework, playbook, or methodology
   - Reverse engineer previous projects to create a formula/steps
   - Layout ALL the steps together — provide a "MAP" for your answer
   - Confirm "big picture" understanding
   - Shows you have a METHODOLOGY — gets you paid more
   - Gives a senior-level outlook, organized, more complete

3. APPROACH² (Step-by-step details — walk through it):
   - Explain, for illustrative purposes, the actions you took for each step
   - Cover highlights — gives speed
   - Focus on YOU within the big picture
   - Guide the interviewer (listener) by showing where you are in the story
   - Shows DEPTH and organization, subject matter expertise

4. RESULT (What happened — Great-8):
   - Share result in context of what you initially foreshadowed (repeat it)
   - Add EXTRA benefits (the extensions — surprise them)
   - Cite results in relation to GREAT-8 accomplishments:
     Revenue Generation, Market Awareness, Customer Attraction, Customer Happiness,
     Company Growth, Employee Happiness, Cost Reduction, Process Efficiency
   - Shows IMPACT, illustrates subject matter expertise
   - End on a high note with SURPRISE extensions

COACHING PHILOSOPHY:
You are not just reformatting — you are a strategic thinking partner. Flag gaps, missed opportunities, and ways to strengthen delivery. The goal is to control the interviewer's emotional and cognitive state throughout the story.

CRITICAL OUTPUT RULES:
- Return ONLY a valid JSON object — no markdown, no backticks, no preamble, no explanation
- Keep each field concise but complete — aim for 2-4 sentences per section
- If the story content is sparse, work with what you have and flag gaps in coachNotes
- The JSON must be complete and properly closed

OUTPUT FORMAT:
{"context":"...","approach1":"...","approach2":"...","result":"...","coachNotes":"..."}`;

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return errResp("ANTHROPIC_API_KEY not set", 500);

  let story;
  try {
    const body = await req.json();
    story = body.story;
  } catch {
    return errResp("Invalid request body", 400);
  }

  // Truncate very long fields to prevent token overflow
  function trunc(s, max = 600) {
    if (!s) return "";
    return s.length > max ? s.slice(0, max) + "..." : s;
  }

  const userPrompt = `Restructure and coach this STAR story into CA²R format. Return ONLY valid JSON.

STORY TITLE: ${story.title || "Untitled"}
ROLE/CONTEXT: ${trunc(story.context, 200)}
YEAR: ${story.year || ""}
COMPETENCY TAGS: ${(story.tags || []).join(", ")}
OUTCOME CATEGORIES: ${(story.outcomes || []).join(", ")}

SITUATION: ${trunc(story.situation, 600)}
TASK: ${trunc(story.task, 400)}
ACTION: ${trunc(story.action, 800)}
RESULT: ${trunc(story.result, 400)}

Return this exact JSON structure with no other text:
{"context":"...","approach1":"...","approach2":"...","result":"...","coachNotes":"..."}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: CA2R_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) return errResp(data.error?.message || "Haiku error", res.status);

  const raw = data.content?.[0]?.text || "";

  // Robust JSON extraction — handle markdown fences or extra text
  let parsed;
  try {
    // Try direct parse first
    const clean = raw.replace(/```json|```/g, "").trim();
    // Find the first { and last } to extract JSON even with surrounding text
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON object found");
    parsed = JSON.parse(clean.slice(start, end + 1));
  } catch (e) {
    // Return a structured error with the raw output for debugging
    return new Response(
      JSON.stringify({
        error: "Could not parse CA²R output",
        raw: raw.slice(0, 500),
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS } }
    );
  }

  return new Response(JSON.stringify(parsed), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function errResp(msg, status) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
