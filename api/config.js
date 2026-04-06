export const config = { runtime: "edge" };

const CONFIG_DB_ID = "6e69edfc-bfbe-490f-83cd-d86d5a42536f";
const NOTION_VERSION = "2022-06-28";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "NOTION_TOKEN not set" }), {
      status: 500, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const res = await fetch(`https://api.notion.com/v1/databases/${CONFIG_DB_ID}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 50 }),
  });

  const data = await res.json();
  if (!res.ok) {
    return new Response(JSON.stringify({ error: data.message }), {
      status: res.status, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const cfg = {};
  for (const page of data.results || []) {
    const p = page.properties;
    const key = p["Setting"]?.title?.map(t => t.plain_text).join("") || "";
    const val = p["Value"]?.rich_text?.map(t => t.plain_text).join("") || "";
    if (key) cfg[key] = val;
  }

  return new Response(JSON.stringify(cfg), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
