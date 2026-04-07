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

// Build Notion properties from a story object.
// Supports BOTH camelCase keys (from StoryModal) AND Notion field names (from direct patchStory calls).
function buildProperties(story, partial = false) {
  const props = {};

  // Helper: check either the camelCase key OR the Notion field name
  const has = (camel, notionKey) =>
    !partial || story[camel] !== undefined || story[notionKey] !== undefined;

  // Helper: get value, preferring camelCase but falling back to Notion key
  const get = (camel, notionKey) =>
    story[camel] !== undefined ? story[camel] : story[notionKey];

  if (has("title", "Story Title"))
    props["Story Title"] = { title: [{ text: { content: String(get("title", "Story Title") || "") } }] };

  if (has("context", "Role/Context"))
    props["Role/Context"] = rt(get("context", "Role/Context"));

  if (has("situation", "Situation"))
    props["Situation"] = rt(get("situation", "Situation"));

  if (has("task", "Task"))
    props["Task"] = rt(get("task", "Task"));

  if (has("action", "Action"))
    props["Action"] = rt(get("action", "Action"));

  if (has("result", "Result"))
    props["Result"] = rt(get("result", "Result"));

  if (has("status", "Status"))
    props["Status"] = { select: { name: get("status", "Status") || "Active" } };

  // Star Rating — accepts both "rating" (camelCase) and "Star Rating" (direct Notion key)
  if (has("rating", "Star Rating"))
    props["Star Rating"] = { number: Number(get("rating", "Star Rating") || 0) };

  if (has("tags", "Tags"))
    props["Tags"] = { multi_select: (get("tags", "Tags") || []).map(n => ({ name: n })) };

  if (has("year", "Year"))
    props["Year"] = { number: get("year", "Year") ? Number(get("year", "Year")) : null };

  if (has("outcomes", "Outcomes"))
    props["Outcomes"] = { multi_select: (get("outcomes", "Outcomes") || []).map(n => ({ name: n })) };

  if (has("mental_model", "Mental Model"))
    props["Mental Model"] = { multi_select: (get("mental_model", "Mental Model") || []).map(n => ({ name: n })) };

  if (has("mental_model_steps", "Mental Model Steps"))
    props["Mental Model Steps"] = rt(get("mental_model_steps", "Mental Model Steps"));

  // KW fields — accept both camelCase and Notion field name
  if (has("kw_power_words", "KW Power Words") || story["KW Power Words"] !== undefined)
    props["KW Power Words"] = rt(get("kw_power_words", "KW Power Words") || story["KW Power Words"] || "");

  if (has("kw_metrics", "KW Metrics") || story["KW Metrics"] !== undefined)
    props["KW Metrics"] = rt(get("kw_metrics", "KW Metrics") || story["KW Metrics"] || "");

  if (has("kw_phrases", "KW Phrases") || story["KW Phrases"] !== undefined)
    props["KW Phrases"] = rt(get("kw_phrases", "KW Phrases") || story["KW Phrases"] || "");

  if (has("car2r_context", "CA2R Context"))
    props["CA2R Context"] = rt(get("car2r_context", "CA2R Context"));

  if (has("car2r_approach1", "CA2R Approach1"))
    props["CA2R Approach1"] = rt(get("car2r_approach1", "CA2R Approach1"));

  if (has("car2r_approach2", "CA2R Approach2"))
    props["CA2R Approach2"] = rt(get("car2r_approach2", "CA2R Approach2"));

  if (has("car2r_result", "CA2R Result"))
    props["CA2R Result"] = rt(get("car2r_result", "CA2R Result"));

  if (has("car2r_coach", "CA2R Coach Notes"))
    props["CA2R Coach Notes"] = rt(get("car2r_coach", "CA2R Coach Notes"));

  if (has("car2r_generated", "CA2R Generated"))
    props["CA2R Generated"] = { checkbox: get("car2r_generated", "CA2R Generated") === true };

  return props;
}

async function notionRequest(path, method, body, token) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
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
      if (!id) return errResp("Missing id", 400);
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
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
