const postsEl = document.getElementById("posts");
const emptyStateEl = document.getElementById("emptyState");
const countBadgeEl = document.getElementById("countBadge");

const refreshBtn = document.getElementById("refreshBtn");
const apiStatusEl = document.getElementById("apiStatus");
const statusDot = apiStatusEl.querySelector(".dot");
const statusText = apiStatusEl.querySelector(".status-text");

const form = document.getElementById("blogForm");
const formTitleEl = document.getElementById("formTitle");
const editBadgeEl = document.getElementById("editBadge");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formErrorEl = document.getElementById("formError");

const titleInput = document.getElementById("title");
const bodyInput = document.getElementById("body");
const authorInput = document.getElementById("author");
const titleHint = document.getElementById("titleHint");
const bodyHint = document.getElementById("bodyHint");
const countEl = document.getElementById("count");

const previewAuthor = document.getElementById("previewAuthor");
const previewBody = document.getElementById("previewBody");
const previewCard = document.getElementById("previewCard");
const previewTitle = previewCard.querySelector(".preview-title");

const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort");

const modal = document.getElementById("modal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const toast = document.getElementById("toast");

let posts = [];
let editingId = null;
let pendingDeleteId = null;

function showToast(message, type = "ok") {
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => (toast.hidden = true), 2400);
}

function setApiStatus(ok) {
  statusDot.style.background = ok ? "var(--ok)" : "var(--bad)";
  statusText.textContent = ok ? "API: online" : "API: offline";
}

async function pingApi() {
  try {
    const res = await fetch("/health");
    setApiStatus(res.ok);
  } catch {
    setApiStatus(false);
  }
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "-";
  }
}

function escapeHtml(str) {
  return (str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFilteredSorted() {
  const q = (searchInput.value || "").trim().toLowerCase();
  let list = [...posts];

  if (q) {
    list = list.filter((p) => {
      const t = (p.title || "").toLowerCase();
      const a = (p.author || "").toLowerCase();
      return t.includes(q) || a.includes(q);
    });
  }

  const mode = sortSelect.value;
  if (mode === "new") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (mode === "old") list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (mode === "title") list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  return list;
}

function render() {
  const list = getFilteredSorted();
  countBadgeEl.textContent = String(list.length);

  postsEl.innerHTML = "";
  emptyStateEl.hidden = list.length !== 0;

  list.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";

    const safeTitle = escapeHtml(p.title);
    const safeAuthor = escapeHtml(p.author || "Anonymous");

    card.innerHTML = `
      <div class="card-top">
        <div>
          <h4>${safeTitle}</h4>
          <div class="meta">
            <span class="pill">Author: ${safeAuthor}</span>
            <span class="pill">Created: ${escapeHtml(fmtDate(p.createdAt))}</span>
            <span class="pill">ID: ${escapeHtml(p._id)}</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-ghost small-btn" data-action="copy" data-id="${escapeHtml(p._id)}">Copy ID</button>
        <button class="btn btn-ghost small-btn" data-action="edit" data-id="${escapeHtml(p._id)}">Edit</button>
        <button class="btn btn-danger small-btn" data-action="delete" data-id="${escapeHtml(p._id)}">Delete</button>
      </div>
    `;

    postsEl.appendChild(card);
  });
}

function setEditing(post) {
  editingId = post ? post._id : null;

  if (post) {
    formTitleEl.textContent = "Edit post";
    editBadgeEl.textContent = "Editing";
    submitBtn.textContent = "Save";
    cancelBtn.hidden = false;

    titleInput.value = post.title || "";
    bodyInput.value = post.body || "";
    authorInput.value = post.author || "";
  } else {
    formTitleEl.textContent = "Create post";
    editBadgeEl.textContent = "New";
    submitBtn.textContent = "Create";
    cancelBtn.hidden = true;

    form.reset();
  }

  updatePreview();
  validateLive(true);
}

function updatePreview() {
  const t = (titleInput.value || "").trim();
  const b = (bodyInput.value || "").trim();
  const a = (authorInput.value || "").trim() || "Anonymous";

  previewTitle.textContent = t || "Title preview will appear here";
  previewAuthor.textContent = a;
  previewBody.textContent = b || "Body preview will appear here";
  countEl.textContent = String(bodyInput.value.length);
}

function validateLive(silent = false) {
  const t = (titleInput.value || "").trim();
  const b = (bodyInput.value || "").trim();

  let ok = true;
  titleHint.textContent = "";
  bodyHint.textContent = "";
  formErrorEl.hidden = true;

  if (!t) {
    ok = false;
    titleHint.textContent = "Title is required.";
  }
  if (!b) {
    ok = false;
    bodyHint.textContent = "Body is required.";
  }

  if (!ok && !silent) {
    formErrorEl.textContent = "Please fill in the required fields (title and body).";
    formErrorEl.hidden = false;
  }

  return ok;
}

async function fetchPosts() {
  try {
    const res = await fetch("/blogs");
    if (!res.ok) throw new Error(`GET /blogs failed (${res.status})`);
    posts = await res.json();
    render();
  } catch (e) {
    showToast("Failed to load posts.", "bad");
    console.error(e);
  }
}

async function createPost(payload) {
  const res = await fetch("/blogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `POST failed (${res.status})`);
  }
  return res.json();
}

async function updatePost(id, payload) {
  const res = await fetch(`/blogs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `PUT failed (${res.status})`);
  }
  return res.json();
}

async function deletePost(id) {
  const res = await fetch(`/blogs/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `DELETE failed (${res.status})`);
  }
  return res.json();
}

function openModal(id) {
  pendingDeleteId = id;
  modal.hidden = false;
}
function closeModal() {
  pendingDeleteId = null;
  modal.hidden = true;
}

postsEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === "copy") {
    try {
      await navigator.clipboard.writeText(id);
      showToast("ID copied.", "ok");
    } catch {
      showToast("Copy failed.", "bad");
    }
    return;
  }

  if (action === "edit") {
    const post = posts.find((p) => p._id === id);
    if (!post) return;
    setEditing(post);
    showToast("Edit mode enabled.", "ok");
    return;
  }

  if (action === "delete") {
    openModal(id);
  }
});

confirmDeleteBtn.addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  try {
    await deletePost(pendingDeleteId);
    showToast("Post deleted.", "ok");
    closeModal();
    if (editingId === pendingDeleteId) setEditing(null);
    await fetchPosts();
  } catch (e) {
    showToast(e.message, "bad");
  }
});

modal.addEventListener("click", (e) => {
  if (e.target?.dataset?.close === "1") closeModal();
});

refreshBtn.addEventListener("click", async () => {
  await fetchPosts();
  await pingApi();
  showToast("Refreshed.", "ok");
});

cancelBtn.addEventListener("click", () => setEditing(null));

titleInput.addEventListener("input", () => {
  updatePreview();
  validateLive(true);
});
bodyInput.addEventListener("input", () => {
  updatePreview();
  validateLive(true);
});
authorInput.addEventListener("input", updatePreview);

searchInput.addEventListener("input", render);
sortSelect.addEventListener("change", render);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateLive(false)) return;

  const payload = {
    title: titleInput.value.trim(),
    body: bodyInput.value.trim(),
    author: authorInput.value.trim(),
  };

  try {
    if (editingId) {
      await updatePost(editingId, payload);
      showToast("Post updated.", "ok");
    } else {
      await createPost(payload);
      showToast("Post created.", "ok");
    }

    setEditing(null);
    await fetchPosts();
  } catch (err) {
    formErrorEl.textContent = err.message;
    formErrorEl.hidden = false;
    showToast("Request failed.", "bad");
  }
});

(async function init() {
  updatePreview();
  await pingApi();
  await fetchPosts();
})();
