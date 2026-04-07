export const config = { runtime: "edge" };

const CHANGELOG_DB_ID = "2cc76b4e-5f94-43e8-a0ae-1ffbe89914a2";
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

  const res = await fetch(`https://api.notion.com/v1/databases/${CHANGELOG_DB_ID}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      page_size: 20,
      sorts: [{ property: "Date", direction: "descending" }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return new Response(JSON.stringify({ error: data.message }), {
      status: res.status, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const entries = (data.results || []).map(page => {
    const p = page.properties;
    return {
      version: p["Version"]?.title?.map(t => t.plain_text).join("") || "",
      date:    p["Date"]?.date?.start || "",
      status:  p["Status"]?.select?.name || "",
      summary: p["Summary"]?.rich_text?.map(t => t.plain_text).join("") || "",
    };
  });

  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
