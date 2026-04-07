export const config = { runtime: "edge" };

const DB_ID = "71604f6f4c484bdfbd810a15c0841371";
const NOTION_VERSION = "2022-06-28";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function textOf(prop) {
  return prop?.rich_text?.map(t => t.plain_text).join("") || "";
}

// Parse comma-separated string stored in rich_text back to array
function csvToArr(prop) {
  const s = textOf(prop);
  return s ? s.split(",").map(x => x.trim()).filter(Boolean) : [];
}

function pageToStory(page) {
  const p = page.properties;
  return {
    id:       page.id,
    title:    p["Story Title"]?.title?.map(t => t.plain_text).join("") || "",
    context:  textOf(p["Role/Context"]),
    situation: textOf(p["Situation"]),
    task:     textOf(p["Task"]),
    action:   textOf(p["Action"]),
    result:   textOf(p["Result"]),
    status:   p["Status"]?.select?.name || "Active",
    rating:   p["Star Rating"]?.number || 0,
    tags:     (p["Tags"]?.multi_select || []).map(t => t.name),
    year:     p["Year"]?.number || null,
    outcomes: (p["Outcomes"]?.multi_select || []).map(t => t.name),
    mental_model:       (p["Mental Model"]?.multi_select || []).map(t => t.name),
    mental_model_steps: textOf(p["Mental Model Steps"]),
    kw_power_words: csvToArr(p["KW Power Words"]),
    kw_metrics:     csvToArr(p["KW Metrics"]),
    kw_phrases:     csvToArr(p["KW Phrases"]),
    car2r_context:   textOf(p["CA2R Context"]),
    car2r_approach1: textOf(p["CA2R Approach1"]),
    car2r_approach2: textOf(p["CA2R Approach2"]),
    car2r_result:    textOf(p["CA2R Result"]),
    car2r_coach:     textOf(p["CA2R Coach Notes"]),
    car2r_generated: p["CA2R Generated"]?.checkbox || false,
  };
}

function rt(value) {
  return { rich_text: [{ text: { content: String(value || "") } }] };
}

function buildProperties(story, partial = false) {
  const has = key => story[key] !== undefined;
  const props = {};

  if (!partial || has("title"))    props["Story Title"]  = { title: [{ text: { content: story.title || "" } }] };
  if (!partial || has("context"))  props["Role/Context"] = rt(story.context);
  if (!partial || has("situation")) props["Situation"]   = rt(story.situation);
  if (!partial || has("task"))     props["Task"]         = rt(story.task);
  if (!partial || has("action"))   props["Action"]       = rt(story.action);
  if (!partial || has("result"))   props["Result"]       = rt(story.result);
  if (!partial || has("status"))   props["Status"]       = { select: { name: story.status || "Active" } };
  if (!partial || has("rating"))   props["Star Rating"]  = { number: story.rating || 0 };
  if (!partial || has("tags"))     props["Tags"]         = { multi_select: (story.tags || []).map(n => ({ name: n })) };
  if (!partial || has("year"))     props["Year"]         = { number: story.year ? Number(story.year) : null };
  if (!partial || has("outcomes")) props["Outcomes"]     = { multi_select: (story.outcomes || []).map(n => ({ name: n })) };
  if (!partial || has("mental_model"))       props["Mental Model"]       = { multi_select: (story.mental_model || []).map(n => ({ name: n })) };
  if (!partial || has("mental_model_steps")) props["Mental Model Steps"] = rt(story.mental_model_steps);
  // KW fields stored as comma-separated strings
  if (!partial || has("KW Power Words")) props["KW Power Words"] = rt(story["KW Power Words"] || "");
  if (!partial || has("KW Metrics"))     props["KW Metrics"]     = rt(story["KW Metrics"] || "");
  if (!partial || has("KW Phrases"))     props["KW Phrases"]     = rt(story["KW Phrases"] || "");
  if (!partial || has("car2r_context"))   props["CA2R Context"]    = rt(story.car2r_context);
  if (!partial || has("car2r_approach1")) props["CA2R Approach1"]  = rt(story.car2r_approach1);
  if (!partial || has("car2r_approach2")) props["CA2R Approach2"]  = rt(story.car2r_approach2);
  if (!partial || has("car2r_result"))    props["CA2R Result"]     = rt(story.car2r_result);
  if (!partial || has("car2r_coach"))     props["CA2R Coach Notes"]= rt(story.car2r_coach);
  if (!partial || has("car2r_generated")) props["CA2R Generated"]  = { checkbox: story.car2r_generated === true };

  return props;
}

async function notionRequest(path, method, body, token) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const token = process.env.NOTION_TOKEN;
  if (!token) return errResp("NOTION_TOKEN not set", 500);

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "list") {
      const data = await notionRequest(`/databases/${DB_ID}/query`, "POST", {
        page_size: 100,
        sorts: [{ property: "Last Edited", direction: "descending" }],
      }, token);
      return ok((data.results || []).map(pageToStory));
    }

    if (action === "schema") {
      const data = await notionRequest(`/databases/${DB_ID}`, "GET", null, token);
      const tags = (data.properties?.Tags?.multi_select?.options || []).map(o => o.name);
      return ok({ tags });
    }

    if (action === "create") {
      const body = await req.json();
      const data = await notionRequest("/pages", "POST", {
        parent: { database_id: DB_ID },
        properties: buildProperties(body, false),
      }, token);
      return ok({ id: data.id });
    }

    if (action === "update") {
      const body = await req.json();
      const { id, ...story } = body;
      const data = await notionRequest(`/pages/${id}`, "PATCH", {
        properties: buildProperties(story, true),
      }, token);
      return ok({ id: data.id });
    }

    return errResp("Unknown action", 400);
  } catch (e) {
    return errResp(e.message || "Server error", 500);
  }
}

function ok(data) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
function errResp(msg, status) {
  return new Response(JSON.stringify({ error: msg }), {
    status, headers: { "Content-Type": "application/json", ...CORS },
  });
}
