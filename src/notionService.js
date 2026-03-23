const API = "/api/notion";

async function call(action, body = null) {
  const res = await fetch(`${API}?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const fetchStories = ()             => call("list");
export const createStory  = (story)        => call("create", story);
export const updateStory  = (id, story)    => call("update", { id, ...story });

// patchStory: pass flat key/value pairs using the same lowercase keys as the story object
// The edge function's buildProperties handles mapping them to Notion property names
export const patchStory = (id, fields)     => call("update", { id, ...fields });
