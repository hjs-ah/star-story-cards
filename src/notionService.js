const DS_ID = "e6fc2bfa-0ce6-4f89-b48d-a306543e8b8d";
const NOTION_MCP = "https://mcp.notion.com/mcp";

async function callClaude(userPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are a Notion MCP assistant for the Interview Stories (STAR) database (data_source_id: ${DS_ID}).
Each page has: Story Title (title), Role/Context (text), Situation (text), Task (text), Action (text), Result (text), Status SELECT(Active/Draft/Archived), Star Rating (number), Tags MULTI_SELECT.
When asked to return data, return ONLY valid JSON. No markdown fencing, no preamble.`,
      messages: [{ role: "user", content: userPrompt }],
      mcp_servers: [{ type: "url", url: NOTION_MCP, name: "notion" }],
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data;
}

function extractText(data) {
  let text = "";
  for (const block of data.content || []) {
    if (block.type === "text") text += block.text;
    if (block.type === "mcp_tool_result") {
      text += block.content?.[0]?.text || "";
    }
  }
  return text;
}

function parseJSON(raw) {
  const clean = raw.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  return JSON.parse(clean.slice(start, end + 1));
}

export async function fetchStories() {
  const data = await callClaude(
    `Query the Notion database data_source_id "${DS_ID}". Return ALL pages as a JSON array. Each object: id (page id), title (Story Title), context (Role/Context), situation, task, action, result, status (Status), rating (Star Rating as integer, 0 if null), tags (Tags as string array). Return ONLY the JSON array.`
  );
  const text = extractText(data);
  return parseJSON(text);
}

export async function createStory(story) {
  await callClaude(
    `Create a new page in Notion database data_source_id "${DS_ID}". Properties: Story Title = "${story.title}", Role/Context = "${story.context || ""}", Situation = "${story.situation || ""}", Task = "${story.task || ""}", Action = "${story.action || ""}", Result = "${story.result || ""}", Status = "${story.status || "Active"}", Star Rating = ${story.rating || 5}, Tags = ${JSON.stringify(story.tags || [])}. Confirm when done.`
  );
}

export async function updateStory(id, story) {
  await callClaude(
    `Update Notion page id "${id}" in data_source_id "${DS_ID}". Set: Story Title = "${story.title}", Role/Context = "${story.context || ""}", Situation = "${story.situation || ""}", Task = "${story.task || ""}", Action = "${story.action || ""}", Result = "${story.result || ""}", Status = "${story.status || "Active"}", Star Rating = ${story.rating || 5}, Tags = ${JSON.stringify(story.tags || [])}. Confirm when done.`
  );
}

export async function patchStory(id, fields) {
  const parts = Object.entries(fields)
    .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
    .join(", ");
  await callClaude(
    `Update Notion page id "${id}" in data_source_id "${DS_ID}". Set: ${parts}. Confirm when done.`
  );
}
