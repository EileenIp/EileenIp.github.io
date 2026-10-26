// Renders data/pet-progress.json, which the daily update writes from my private
// task list (public items only). Text is always set with textContent.
const PET_DATA_URL = "data/pet-progress.json";

function petDay(isoDate) {
  // "2026-10-27" -> "27 Oct". Parsed as UTC and formatted as UTC so the date never shifts.
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
}

function petUpdatedText(updated) {
  if (!updated) return "Nothing published yet. This fills in after the first daily update.";
  const d = new Date(updated);
  if (Number.isNaN(d.getTime())) return "";
  const when = d.toLocaleString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZone: "Australia/Brisbane",
  });
  return `Updated ${when} (Brisbane time)`;
}

function petRenderList(listId, items, emptyText, whenText) {
  const ul = document.getElementById(listId);
  ul.replaceChildren();
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "pet-note";
    li.textContent = emptyText;
    ul.append(li);
    return;
  }
  for (const item of items) {
    const li = document.createElement("li");
    const title = document.createElement("span");
    title.textContent = item.title;
    const tag = document.createElement("span");
    tag.className = "tag tag-neutral";
    tag.textContent = item.category;
    li.append(title, tag);
    const when = whenText(item);
    if (when) {
      const w = document.createElement("span");
      w.className = "pet-when";
      w.textContent = when;
      li.append(w);
    }
    ul.append(li);
  }
}

function petRender(data) {
  document.getElementById("pet-updated").textContent = petUpdatedText(data.updated);
  document.getElementById("pet-streak").textContent = String(data.streak_days ?? 0);
  document.getElementById("pet-week").textContent = String(data.stats?.completed_this_week ?? 0);
  document.getElementById("pet-total").textContent = String(data.stats?.completed_total ?? 0);
  petRenderList("pet-todo", data.todo || [], "Nothing open right now.",
    (t) => (t.due ? `due ${petDay(t.due)}` : ""));
  petRenderList("pet-done", data.recently_done || [], "Nothing finished in the last 7 days.",
    (t) => petDay(t.completed));
  document.getElementById("pet-content").hidden = false;
}

fetch(PET_DATA_URL, { cache: "no-cache" })
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(petRender)
  .catch(() => {
    document.getElementById("pet-updated").textContent =
      "I couldn’t load the latest progress just now. Please try again later.";
  });
