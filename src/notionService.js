// All Notion reads/writes go through /api/notion on Vercel (or Vite dev proxy).
// The Notion token lives in NOTION_TOKEN env var — never in the browser.

const API = "/api/notion";

async function call(action, body = null) {
  const res = await fetch(`${API}?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const fetchStories = () => call("list");
export const createStory  = (story) => call("create", story);
export const updateStory  = (id, story) => call("update", { id, ...story });
export const patchStory   = (id, fields) => call("update", { id, ...fields });
