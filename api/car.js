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

OUTPUT FORMAT (return ONLY valid JSON, no markdown, no preamble):
{
  "context": "The restructured Context section — why it matters, primed with result, you at center",
  "approach1": "The system/MAP section — framework name + step names only, racing through methodology",
  "approach2": "The step-by-step detail section — walk through each step with highlights, YOU-focused",
  "result": "The result section — foreshadowed outcome repeated + extensions + GREAT-8 connections",
  "coachNotes": "2-4 specific coaching observations: gaps, missed opportunities, ways to elevate delivery, which GREAT-8 categories this story hits strongest, suggested power phrases"
}`;

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return errResp("ANTHROPIC_API_KEY not set", 500);

  const { story } = await req.json();

  const userPrompt = `Restructure and coach this STAR story into CA²R format:

STORY TITLE: ${story.title}
ROLE/CONTEXT: ${story.context || ""}
YEAR: ${story.year || ""}

SITUATION (S):
${story.situation || ""}

TASK (T):
${story.task || ""}

ACTION (A):
${story.action || ""}

RESULT (R):
${story.result || ""}

COMPETENCY TAGS: ${(story.tags || []).join(", ")}
OUTCOME CATEGORIES ALREADY TAGGED: ${(story.outcomes || []).join(", ")}

Restructure into CA²R format AND provide coaching notes. Return ONLY valid JSON.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: CA2R_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) return errResp(data.error?.message || "Haiku error", res.status);

  const text = data.content?.[0]?.text || "{}";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch {
    return errResp("Could not parse CA²R output", 500);
  }

  function errResp(msg, status) {
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

function errResp(msg, status) {
  return new Response(JSON.stringify({ error: msg }), {
    status, headers: { "Content-Type": "application/json", ...CORS },
  });
}
