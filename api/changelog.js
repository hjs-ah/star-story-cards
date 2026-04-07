export const config = { runtime: "edge" };

const CHANGELOG_DB_ID = "2cc76b4e-5f94-43e8-a0ae-1ffbe89914a2";
const NOTION_VERSION = "2022-06-28";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Static fallback — shown if Notion integration doesn't have access yet
const STATIC_FALLBACK = [
  {
    version: "v2.0 — Planned Features",
    date: "2026-04-07",
    status: "Planned",
    summary: "Mental Model field — chevron visual on cards + filter. Challenges field. Fix/Resolve buttons on coach notes. Condensed view improvement. Mobile optimization pass.",
  },
  {
    version: "v1.3 — Bug Fixes + Story Data Entry",
    date: "2026-04-07",
    status: "Released",
    summary: "Fixed ALL_OUTCOMES crash, CA²R toggle string mismatch, raised Haiku max_tokens to 2000, robust JSON extraction in /api/car. Entered 4 stories via Notion MCP. Added Impact/Outcomes labels to tag rows. Focus overlay inherits global STAR/CA²R mode.",
  },
  {
    version: "v1.2 — CA²R Mode + Outcome Tags",
    date: "2026-04-03",
    status: "Released",
    summary: "Global STAR|CA²R toggle, Haiku-powered CA²R generation via /api/car, coach notes, 8 Outcome tags, keyword suggestions via /api/suggest, career timeline, Mental Model chevron display.",
  },
  {
    version: "v1.1 — Hero Header + Site Config",
    date: "2026-04-02",
    status: "Released",
    summary: "Dark hero header with gold ring photo, social links, role/location. Notion-editable via Site Config database. /api/config edge function.",
  },
  {
    version: "v1.0 — Initial Launch",
    date: "2026-04-01",
    status: "Released",
    summary: "STAR story cards, 1/2/3 column grid, condensed/full toggle, dark/light mode, status/tag/year filters, star rating, Focus overlay, full Notion CRUD.",
  },
];

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const token = process.env.NOTION_TOKEN;
  if (!token) return ok(STATIC_FALLBACK);

  try {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${CHANGELOG_DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_size: 20,
          sorts: [{ property: "Date", direction: "descending" }],
        }),
      }
    );

    const data = await res.json();

    // If Notion returns an error (e.g. no access), fall back to static data
    if (!res.ok || data.object === "error") {
      console.log("Changelog Notion error, using fallback:", data.message || data.code);
      return ok(STATIC_FALLBACK);
    }

    const entries = (data.results || []).map((page) => {
      const p = page.properties;
      return {
        version: p["Version"]?.title?.map((t) => t.plain_text).join("") || "",
        date: p["Date"]?.date?.start || "",
        status: p["Status"]?.select?.name || "",
        summary: p["Summary"]?.rich_text?.map((t) => t.plain_text).join("") || "",
      };
    });

    // If Notion returns empty, use fallback
    return ok(entries.length > 0 ? entries : STATIC_FALLBACK);
  } catch (e) {
    console.log("Changelog fetch failed, using fallback:", e.message);
    return ok(STATIC_FALLBACK);
  }
}

function ok(data) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
