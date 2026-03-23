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
  if (!token) {
    return new Response(
      JSON.stringify({ error: "NOTION_TOKEN environment variable is not set in Vercel." }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS } }
    );
  }

  const notionHeaders = {
    "Authorization": `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // ── LIST ──────────────────────────────────────────────────────────────────
    if (action === "list") {
      const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({ page_size: 100 }),
      });
      const data = await res.json();
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: `Notion API error: ${data.message || res.status}. Make sure your integration is connected to the database.` }),
          { status: res.status, headers: { "Content-Type": "application/json", ...CORS } }
        );
      }
      return new Response(JSON.stringify((data.results || []).map(pageToStory)), {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    if (action === "create") {
      const body = await req.json();
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({ parent: { database_id: DB_ID }, properties: buildProperties(body) }),
      });
      const data = await res.json();
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: `Notion create error: ${data.message || res.status}` }),
          { status: res.status, headers: { "Content-Type": "application/json", ...CORS } }
        );
      }
      return new Response(JSON.stringify(pageToStory(data)), {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    // ── UPDATE (full or patch) ────────────────────────────────────────────────
    if (action === "update") {
      const body = await req.json();
      const { id, ...fields } = body;
      // Only send properties that are actually present in the payload
      const props = buildProperties(fields, true);
      const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
        method: "PATCH",
        headers: notionHeaders,
        body: JSON.stringify({ properties: props }),
      });
      const data = await res.json();
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: `Notion update error: ${data.message || res.status}` }),
          { status: res.status, headers: { "Content-Type": "application/json", ...CORS } }
        );
      }
      return new Response(JSON.stringify(pageToStory(data)), {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { "Content-Type": "application/json", ...CORS },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}

// ── Notion page → flat story object ──────────────────────────────────────────
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
  };
}

// ── Flat story → Notion properties payload ────────────────────────────────────
// partialMode = true → only include keys that are explicitly present in the object
// This prevents a patch({status:"Archived"}) from wiping title to ""
function buildProperties(story, partialMode = false) {
  const has = (k) => story[k] !== undefined || story[kMap[k]] !== undefined;
  const val = (k) => story[k] !== undefined ? story[k] : story[kMap[k]];

  // Accept both lowercase (app) and capitalized (legacy) key names
  const kMap = {
    title:     "Story Title",
    context:   "Role/Context",
    situation: "Situation",
    task:      "Task",
    action:    "Action",
    result:    "Result",
    status:    "Status",
    rating:    "Star Rating",
    tags:      "Tags",
  };

  const props = {};

  if (!partialMode || has("title")) {
    props["Story Title"] = { title: [{ text: { content: String(val("title") || "") } }] };
  }
  if (!partialMode || has("context")) {
    props["Role/Context"] = { rich_text: [{ text: { content: String(val("context") || "") } }] };
  }
  if (!partialMode || has("situation")) {
    props["Situation"] = { rich_text: [{ text: { content: String(val("situation") || "") } }] };
  }
  if (!partialMode || has("task")) {
    props["Task"] = { rich_text: [{ text: { content: String(val("task") || "") } }] };
  }
  if (!partialMode || has("action")) {
    props["Action"] = { rich_text: [{ text: { content: String(val("action") || "") } }] };
  }
  if (!partialMode || has("result")) {
    props["Result"] = { rich_text: [{ text: { content: String(val("result") || "") } }] };
  }
  if (!partialMode || has("status")) {
    props["Status"] = { select: { name: String(val("status") || "Active") } };
  }
  if (!partialMode || has("rating")) {
    props["Star Rating"] = { number: Number(val("rating") || 0) };
  }
  if (!partialMode || has("tags")) {
    props["Tags"] = { multi_select: (val("tags") || []).map(name => ({ name })) };
  }

  return props;
}

function textOf(prop) {
  if (!prop) return "";
  if (prop.title)     return prop.title.map(t => t.plain_text).join("");
  if (prop.rich_text) return prop.rich_text.map(t => t.plain_text).join("");
  return "";
}
