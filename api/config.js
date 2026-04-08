export const config = { runtime: "edge" };

const CONFIG_DB_ID = "6e69edfc-bfbe-490f-83cd-d86d5a42536f";
const NOTION_VERSION = "2022-06-28";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Static fallback — matches the rows now in the Notion Site Config database.
// These are used when the Notion integration hasn't been connected yet.
// To update values without touching code: edit them in Notion (Site Config DB).
// To update the fallback too: edit the values below.
const STATIC_FALLBACK = {
  full_name:       "Antone Holmes, MA",
  title:           "Practitioner of Strategy in Philanthropy, Theology, & Revenue Enablement",
  location:        "United States",
  photo_url:       "https://hjs-ah.github.io/AH-FE-2.0/assets/DrH_MultiM.png",
  social_linkedin: "https://linkedin.com/in/antoneholmes",
  social_medium:   "https://medium.com/@antoneh",
  social_behance:  "https://behance.net/antoneholmes",
  social_figma:    "https://figma.com/@antoneholmes",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const token = process.env.NOTION_TOKEN;
  if (!token) return ok(STATIC_FALLBACK);

  try {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${CONFIG_DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 50 }),
      }
    );

    const data = await res.json();

    if (!res.ok || data.object === "error") {
      return ok(STATIC_FALLBACK);
    }

    // Merge Notion rows over the fallback so missing keys stay populated
    const cfg = { ...STATIC_FALLBACK };
    for (const page of data.results || []) {
      const p   = page.properties;
      const key = p["Setting"]?.title?.map(t => t.plain_text).join("").trim();
      const val = p["Value"]?.rich_text?.map(t => t.plain_text).join("").trim();
      if (key && val) cfg[key] = val;
    }

    return ok(cfg);
  } catch {
    return ok(STATIC_FALLBACK);
  }
}

function ok(data) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
