export const config = { runtime: "edge" };

const NOTION_VERSION = "2022-06-28";
const DB_ID = "71604f6f4c484bdfbd810a15c0841371";

export default async function handler(req) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const token = process.env.NOTION_TOKEN;
  if (!token) return jsonError("NOTION_TOKEN not set in Vercel environment.", 500, CORS);

  const notionHeaders = {
    "Authorization": `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // ── LIST stories ─────────────────────────────────────────────────────────
    if (action === "list") {
      const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: "POST", headers: notionHeaders,
        body: JSON.stringify({ page_size: 100, sorts: [{ property: "Year", direction: "descending" }] }),
      });
      const data = await res.json();
      if (!res.ok) return jsonError(`Notion error: ${data.message}. Check integration is connected to the database.`, res.status, CORS);
      return json((data.results || []).map(pageToStory), CORS);
    }

    // ── GET database schema (for dynamic tags) ────────────────────────────────
    if (action === "schema") {
      const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}`, {
        method: "GET", headers: notionHeaders,
      });
      const data = await res.json();
      if (!res.ok) return jsonError(`Notion error: ${data.message}`, res.status, CORS);
      const tagOptions = (data.properties?.Tags?.multi_select?.options || []).map(o => o.name);
      return json({ tags: tagOptions }, CORS);
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    if (action === "create") {
      const body = await req.json();
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST", headers: notionHeaders,
        body: JSON.stringify({ parent: { database_id: DB_ID }, properties: buildProperties(body) }),
      });
      const data = await res.json();
      if (!res.ok) return jsonError(`Notion create error: ${data.message}`, res.status, CORS);
      return json(pageToStory(data), CORS);
    }

    // ── UPDATE (full or patch) ────────────────────────────────────────────────
    if (action === "update") {
      const body = await req.json();
      const { id, ...fields } = body;
      const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
        method: "PATCH", headers: notionHeaders,
        body: JSON.stringify({ properties: buildProperties(fields, true) }),
      });
      const data = await res.json();
      if (!res.ok) return jsonError(`Notion update error: ${data.message}`, res.status, CORS);
      return json(pageToStory(data), CORS);
    }

    return jsonError("Unknown action", 400, CORS);
  } catch (err) {
    return jsonError(err.message, 500, CORS);
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────
function json(data, cors) {
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...cors } });
}
function jsonError(msg, status, cors) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { "Content-Type": "application/json", ...cors } });
}

function pageToStory(page) {
  const p = page.properties || {};
  return {
    id:        page.id,
    title:     textOf(p["Story Title"]),
    context:   textOf(p["Role/Context"]),
    situation: textOf(p["Situation"]),
    task:      textOf(p["Task"]),
    action:    textOf(p["Action"]),
    result:    textOf(p["Result"]),
    status:    p["Status"]?.select?.name || "Active",
    rating:    p["Star Rating"]?.number || 0,
    tags:      (p["Tags"]?.multi_select || []).map(t => t.name),
    year:      p["Year"]?.number || null,
  };
}

function buildProperties(story, partial = false) {
  const has = k => story[k] !== undefined;
  const props = {};
  if (!partial || has("title"))     props["Story Title"] = { title:      [{ text: { content: String(story.title     || "") } }] };
  if (!partial || has("context"))   props["Role/Context"] = { rich_text: [{ text: { content: String(story.context   || "") } }] };
  if (!partial || has("situation")) props["Situation"]    = { rich_text: [{ text: { content: String(story.situation || "") } }] };
  if (!partial || has("task"))      props["Task"]         = { rich_text: [{ text: { content: String(story.task      || "") } }] };
  if (!partial || has("action"))    props["Action"]       = { rich_text: [{ text: { content: String(story.action    || "") } }] };
  if (!partial || has("result"))    props["Result"]       = { rich_text: [{ text: { content: String(story.result    || "") } }] };
  if (!partial || has("status"))    props["Status"]       = { select:    { name: String(story.status || "Active") } };
  if (!partial || has("rating"))    props["Star Rating"]  = { number:    Number(story.rating || 0) };
  if (!partial || has("tags"))      props["Tags"]         = { multi_select: (story.tags || []).map(n => ({ name: n })) };
  if (!partial || has("year"))      props["Year"]         = { number: story.year ? Number(story.year) : null };
  return props;
}

function textOf(prop) {
  if (!prop) return "";
  if (prop.title)     return prop.title.map(t => t.plain_text).join("");
  if (prop.rich_text) return prop.rich_text.map(t => t.plain_text).join("");
  return "";
}
