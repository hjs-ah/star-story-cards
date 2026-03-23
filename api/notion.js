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
    if (action === "list") {
      const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({ page_size: 100 }),
      });
      const data = await res.json();
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: `Notion API error: ${data.message || res.status}. Make sure your integration is connected to the database in Notion.` }),
          { status: res.status, headers: { "Content-Type": "application/json", ...CORS } }
        );
      }
      const stories = (data.results || []).map(pageToStory);
      return new Response(JSON.stringify(stories), {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    if (action === "create") {
      const body = await req.json();
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify(storyToPage(body, DB_ID)),
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

    if (action === "update") {
      const body = await req.json();
      const { id, ...story } = body;
      const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
        method: "PATCH",
        headers: notionHeaders,
        body: JSON.stringify({ properties: buildProperties(story) }),
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

function pageToStory(page) {
  const p = page.properties || {};
  return {
    id: page.id,
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

function buildProperties(story) {
  return {
    "Story Title": { title:      [{ text: { content: story.title     || "" } }] },
    "Role/Context":{ rich_text:  [{ text: { content: story.context   || "" } }] },
    "Situation":   { rich_text:  [{ text: { content: story.situation || "" } }] },
    "Task":        { rich_text:  [{ text: { content: story.task      || "" } }] },
    "Action":      { rich_text:  [{ text: { content: story.action    || "" } }] },
    "Result":      { rich_text:  [{ text: { content: story.result    || "" } }] },
    "Status":      { select:     { name: story.status || "Active" } },
    "Star Rating": { number:     story.rating || 0 },
    "Tags":        { multi_select: (story.tags || []).map(name => ({ name })) },
  };
}

function storyToPage(story, dbId) {
  return {
    parent: { database_id: dbId },
    properties: buildProperties(story),
  };
}

function textOf(prop) {
  if (!prop) return "";
  if (prop.title)     return prop.title.map(t => t.plain_text).join("");
  if (prop.rich_text) return prop.rich_text.map(t => t.plain_text).join("");
  return "";
}
