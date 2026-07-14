// options.js
let state = null;
let editingRuleId = null;
let editingProfileId = null;
let currentPage = 1;
let letterFilter = null;
let expandedRuleIds = new Set();

function send(msg) { return PH_API.runtime.sendMessage(msg); }
function uid() { return crypto.randomUUID(); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function ruleEnabled(r) { return r.enabled !== false; }

// ---------------- Icons ----------------
function injectStaticIcons() {
  document.getElementById("brandLogo").innerHTML = PH_ICONS.logo;
  document.getElementById("searchIcon").innerHTML = PH_ICONS.search;
  document.getElementById("builtinCdnSearchIcon").innerHTML = PH_ICONS.search;
  document.querySelectorAll("[data-icon]").forEach(el => {
    el.innerHTML = PH_ICONS[el.dataset.icon] || "";
  });
}

// ---------------- Theme ----------------
function setThemeIcon(theme) {
  document.getElementById("themeIcon").innerHTML = theme === "dark" ? PH_ICONS.moon : PH_ICONS.sun;
}
async function loadTheme() {
  const { ph_theme } = await PH_API.storage.local.get("ph_theme");
  const theme = ph_theme || "dark";
  document.documentElement.setAttribute("data-theme", theme);
  setThemeIcon(theme);
}
document.getElementById("themeToggle").addEventListener("click", async () => {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  setThemeIcon(next);
  await PH_API.storage.local.set({ ph_theme: next });
});

// ---------------- Master routing switch ----------------
function renderMasterSwitch() {
  const wrap = document.getElementById("masterSwitch");
  const cb = document.getElementById("globalEnable");
  const icon = document.getElementById("masterSwitchIcon");
  const label = document.getElementById("masterSwitchState");
  cb.checked = !!state.enabled;
  wrap.classList.toggle("is-on", !!state.enabled);
  icon.innerHTML = state.enabled ? PH_ICONS.proxy : PH_ICONS.power;
  label.textContent = state.enabled ? "Enabled" : "All traffic is Direct";
}
document.getElementById("globalEnable").addEventListener("change", async (e) => {
  state.enabled = e.target.checked;
  await saveState();
  renderMasterSwitch();
  renderRuleTable();
});

async function loadState() {
  state = await send({ type: "GET_STATE" });
  if (!state.vault) state.vault = { locked: false, saltB64: null };
  if (!state.defaultMode) state.defaultMode = PH_DIRECT_ID;
}
async function saveState() {
  await send({ type: "SET_STATE", state });
}

// ---------------- Tabs ----------------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "vault") refreshVaultStatus();
    if (btn.dataset.tab === "importexport") refreshDiagnostics();
    if (btn.dataset.tab === "knownhosts") renderKnownHosts();
  });
});

// ---------------- Rules: search + AZ nav + pagination ----------------

function profileById(id) {
  if (id === PH_DIRECT_ID) return { id: PH_DIRECT_ID, name: "Direct", color: null };
  return state.profiles.find(p => p.id === id);
}

function primaryDomainOf(rule) {
  if (rule.ownerHost) return rule.ownerHost;
  const p = (rule.patterns && rule.patterns[0]) || "";
  return p.replace(/^\*\./, "");
}

function subPatternsOf(rule) {
  return (rule.patterns || []).slice(1);
}

function filteredRules() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const profileFilterVal = document.getElementById("profileFilter").value;
  return state.rules.filter(r => {
    if (profileFilterVal && r.profileId !== profileFilterVal) return false;
    if (letterFilter) {
      const d = primaryDomainOf(r).toLowerCase();
      if (!d.startsWith(letterFilter.toLowerCase())) return false;
    }
    if (!q) return true;
    const profile = profileById(r.profileId);
    const hay = [...(r.patterns || []), r.note || "", profile ? profile.name : ""].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

function renderAzNav() {
  const azNav = document.getElementById("azNav");
  const letters = new Set();
  for (const r of state.rules) {
    const d = primaryDomainOf(r);
    if (d) letters.add(d[0].toUpperCase());
  }
  const sorted = [...letters].sort();
  azNav.innerHTML = "";
  const allBtn = document.createElement("button");
  allBtn.textContent = "All";
  allBtn.className = letterFilter ? "" : "active";
  allBtn.addEventListener("click", () => { letterFilter = null; currentPage = 1; renderRuleTable(); renderAzNav(); });
  azNav.appendChild(allBtn);
  for (const l of sorted) {
    const b = document.createElement("button");
    b.textContent = l;
    b.className = letterFilter === l ? "active" : "";
    b.addEventListener("click", () => { letterFilter = l; currentPage = 1; renderRuleTable(); renderAzNav(); });
    azNav.appendChild(b);
  }
}

function renderProfileFilterOptions() {
  const sel = document.getElementById("profileFilter");
  const prev = sel.value;
  sel.innerHTML = `<option value="">All profiles</option><option value="${PH_DIRECT_ID}">Direct (no proxy)</option>`;
  for (const p of state.profiles) {
    const opt = document.createElement("option");
    opt.value = p.id; opt.textContent = p.name;
    sel.appendChild(opt);
  }
  sel.value = prev;
}

function profileSelectOptionsHtml(selectedId) {
  let html = `<option value="${PH_DIRECT_ID}" ${selectedId === PH_DIRECT_ID ? "selected" : ""}>Direct (no proxy)</option>`;
  for (const p of state.profiles) {
    html += `<option value="${p.id}" ${selectedId === p.id ? "selected" : ""}>${esc(p.name)}</option>`;
  }
  return html;
}

function renderRuleTable() {
  document.getElementById("ruleCount").textContent = state.rules.length;
  renderProfileFilterOptions();

  const all = filteredRules();
  const pageSize = Number(document.getElementById("pageSize").value);
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = all.slice(start, start + pageSize);

  document.getElementById("pageInfo").textContent =
    `Page ${currentPage} of ${totalPages} — ${all.length} of ${state.rules.length} rules`;

  const tbody = document.getElementById("ruleTableBody");
  tbody.innerHTML = "";

  for (const rule of pageItems) {
    const profile = profileById(rule.profileId);
    const subs = subPatternsOf(rule);
    const isOpen = expandedRuleIds.has(rule.id);
    const disabledLegacy = !ruleEnabled(rule);

    const tr = document.createElement("tr");
    tr.className = "rule-row";
    tr.innerHTML = `
      <td>
        <button class="expand-btn${isOpen ? " is-open" : ""}" data-action="toggle-expand" data-id="${rule.id}" ${subs.length ? "" : "disabled"}>
          <span class="ph-svg">${PH_ICONS.chevron}</span>
        </button>
      </td>
      <td>
        <div class="site-cell">
          <span class="site-domain">${esc(primaryDomainOf(rule))}</span>
          ${subs.length ? `<span class="site-sub-count">+${subs.length}</span>` : ""}
          ${disabledLegacy ? `<span class="site-sub-count" title="This rule is marked disabled">off</span>` : ""}
        </div>
      </td>
      <td class="profile-select-cell">
        <select data-action="inline-profile" data-id="${rule.id}">${profileSelectOptionsHtml(rule.profileId)}</select>
      </td>
      <td>
        <div class="row-actions">
          <button class="icon-only-btn" data-action="edit" data-id="${rule.id}" title="Edit"><span class="ph-svg">${PH_ICONS.edit}</span></button>
          <button class="icon-only-btn danger-hover" data-action="delete" data-id="${rule.id}" title="Delete"><span class="ph-svg">${PH_ICONS.trash}</span></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);

    const subTr = document.createElement("tr");
    subTr.className = "sub-row";
    subTr.dataset.parent = rule.id;
    if (!isOpen || !subs.length) subTr.hidden = true;
    subTr.innerHTML = `
      <td></td>
      <td colspan="3">
        <div class="sub-list">
          ${subs.map(p => `
            <span class="sub-chip" data-pattern="${esc(p)}">
              ${esc(p)}
              <button class="icon-only-btn danger-hover" style="width:16px;height:16px;background:none;border:none" data-action="remove-sub" data-id="${rule.id}" data-pattern="${esc(p)}" title="Remove">
                <span class="ph-svg">${PH_ICONS.close}</span>
              </button>
            </span>
          `).join("")}
        </div>
      </td>
    `;
    tbody.appendChild(subTr);
  }

  tbody.querySelectorAll("[data-action=toggle-expand]").forEach(el =>
    el.addEventListener("click", () => {
      const id = el.dataset.id;
      if (expandedRuleIds.has(id)) expandedRuleIds.delete(id); else expandedRuleIds.add(id);
      renderRuleTable();
    })
  );
  tbody.querySelectorAll("[data-action=inline-profile]").forEach(el =>
    el.addEventListener("change", async () => {
      const rule = state.rules.find(r => r.id === el.dataset.id);
      rule.profileId = el.value;
      rule.enabled = true; // inline change is the "re-enable" path now that the checkbox is gone
      await saveState();
      renderRuleTable();
    })
  );
  tbody.querySelectorAll("[data-action=edit]").forEach(el =>
    el.addEventListener("click", () => openRuleModal(el.dataset.id))
  );
  tbody.querySelectorAll("[data-action=delete]").forEach(el =>
    el.addEventListener("click", async () => {
      state.rules = state.rules.filter(r => r.id !== el.dataset.id);
      await saveState();
      renderRuleTable(); renderAzNav();
    })
  );
  tbody.querySelectorAll("[data-action=remove-sub]").forEach(el =>
    el.addEventListener("click", async () => {
      const rule = state.rules.find(r => r.id === el.dataset.id);
      rule.patterns = (rule.patterns || []).filter(p => p !== el.dataset.pattern);
      await saveState();
      renderRuleTable();
    })
  );
}

document.getElementById("searchInput").addEventListener("input", () => { currentPage = 1; renderRuleTable(); });
document.getElementById("profileFilter").addEventListener("change", () => { currentPage = 1; renderRuleTable(); });
document.getElementById("pageSize").addEventListener("change", () => { currentPage = 1; renderRuleTable(); });
document.getElementById("prevPage").addEventListener("click", () => { if (currentPage > 1) { currentPage--; renderRuleTable(); } });
document.getElementById("nextPage").addEventListener("click", () => { currentPage++; renderRuleTable(); });

// ---------------- Rule modal ----------------

function fillRuleProfileSelect(selectedId) {
  document.getElementById("ruleProfileSelect").innerHTML = profileSelectOptionsHtml(selectedId || (state.profiles[0] && state.profiles[0].id) || PH_DIRECT_ID);
}

function findPatternConflicts(patterns, excludeRuleId, profileId) {
  const conflicts = [];
  for (const p of patterns) {
    for (const r of state.rules) {
      if (r.id === excludeRuleId || !ruleEnabled(r)) continue;
      if (r.profileId === profileId) continue;
      if ((r.patterns || []).includes(p)) {
        conflicts.push({ pattern: p, ruleLabel: primaryDomainOf(r), profileName: (profileById(r.profileId) || {}).name || "Direct" });
      }
    }
  }
  return conflicts;
}

function renderConflictBox() {
  const box = document.getElementById("conflictBox");
  const extraLines = document.getElementById("ruleExtraPatterns").value.split("\n").map(l => l.trim()).filter(Boolean);
  const siteLines = document.getElementById("rulePatterns").value.split("\n").map(l => l.trim()).filter(Boolean);
  const profileId = document.getElementById("ruleProfileSelect").value;
  const conflicts = findPatternConflicts([...siteLines, ...extraLines], editingRuleId, profileId);
  if (!conflicts.length) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `
    <div class="conflict-title"><span class="ph-svg">${PH_ICONS.warning}</span>Pattern already used elsewhere</div>
    <div>${conflicts.map(c => `<div><span class="mono">${esc(c.pattern)}</span> is already routed via <strong>${esc(c.profileName)}</strong> (rule for ${esc(c.ruleLabel)}). A hostname can only follow one proxy at a time — whichever rule sits first in the list wins.</div>`).join("")}</div>
  `;
}

function openRuleModal(ruleId) {
  editingRuleId = ruleId || null;
  const rule = ruleId ? state.rules.find(r => r.id === ruleId) : null;
  fillRuleProfileSelect(rule ? rule.profileId : null);
  document.getElementById("ruleModalTitle").textContent = rule ? "Edit rule" : "New rule";
  document.getElementById("rulePatterns").value = rule ? (rule.patterns[0] || "") : "";
  document.getElementById("ruleExtraPatterns").value = rule ? subPatternsOf(rule).join("\n") : "";
  document.getElementById("ruleNote").value = rule ? (rule.note || "") : "";
  document.getElementById("groupSuggestBox").hidden = true;
  document.getElementById("conflictBox").hidden = true;
  document.getElementById("ruleModal").hidden = false;
  renderConflictBox();
}

document.getElementById("addRuleBtn").addEventListener("click", () => openRuleModal(null));
document.getElementById("ruleCancelBtn").addEventListener("click", () => document.getElementById("ruleModal").hidden = true);
document.getElementById("ruleProfileSelect").addEventListener("change", renderConflictBox);
document.getElementById("ruleExtraPatterns").addEventListener("input", renderConflictBox);

document.getElementById("rulePatterns").addEventListener("input", (e) => {
  const lines = e.target.value.split("\n").map(l => l.trim()).filter(Boolean);
  const box = document.getElementById("groupSuggestBox");
  renderConflictBox();
  if (!lines.length || typeof findGroupForPattern !== "function") { box.hidden = true; return; }
  const group = findGroupForPattern(lines[0], state.knownHosts);
  if (!group) { box.hidden = true; return; }
  const existingExtra = document.getElementById("ruleExtraPatterns").value.split("\n").map(l => l.trim()).filter(Boolean);
  const missing = group.patterns.filter(p => !lines.includes(p) && !existingExtra.includes(p));
  if (!missing.length) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `This domain matches the known group "${esc(group.label)}". For full CDN/media coverage, ${missing.length} related pattern(s) are suggested:
    <div class="mono" style="margin:6px 0;font-size:11.5px;color:var(--text-dim)">${esc(missing.join(", "))}</div>
    <button id="applyGroupSuggest" type="button">Add as related / CDN patterns</button>`;
  document.getElementById("applyGroupSuggest").addEventListener("click", () => {
    const ta = document.getElementById("ruleExtraPatterns");
    const existing = ta.value.split("\n").map(l => l.trim()).filter(Boolean);
    const merged = [...new Set([...existing, ...missing])];
    ta.value = merged.join("\n");
    box.hidden = true;
    renderConflictBox();
  });
});

document.getElementById("ruleSaveBtn").addEventListener("click", async () => {
  const sitePatterns = document.getElementById("rulePatterns").value.split("\n").map(l => l.trim()).filter(Boolean);
  const extraPatterns = document.getElementById("ruleExtraPatterns").value.split("\n").map(l => l.trim()).filter(Boolean);
  const patterns = [...new Set([...sitePatterns, ...extraPatterns])];
  const profileId = document.getElementById("ruleProfileSelect").value;
  const note = document.getElementById("ruleNote").value.trim();
  if (!patterns.length || !profileId) { alert("At least one site pattern and a profile are required."); return; }

  if (editingRuleId) {
    const rule = state.rules.find(r => r.id === editingRuleId);
    Object.assign(rule, { patterns, profileId, note, enabled: true });
    // If the primary pattern changed, this rule may no longer correspond to
    // the popup's tracked owner host — clear the tag so the popup treats
    // it as a manually-managed rule rather than silently mismatching it.
    if (rule.ownerHost && rule.ownerHost !== patterns[0].replace(/^\*\./, "")) delete rule.ownerHost;
  } else {
    state.rules.unshift({ id: uid(), patterns, profileId, note, enabled: true });
  }
  await saveState();
  document.getElementById("ruleModal").hidden = true;
  renderRuleTable(); renderAzNav();
});

// ---------------- Profiles ----------------

function schemeLabel(scheme) {
  if (scheme === "https") return "http+tls";
  return scheme;
}

function renderProfiles() {
  const grid = document.getElementById("profileList");
  grid.innerHTML = "";

  const isDefaultDirect = !state.defaultMode || state.defaultMode === PH_DIRECT_ID;
  const usedByDirect = state.rules.filter(r => r.profileId === PH_DIRECT_ID).length;
  const directCard = document.createElement("div");
  directCard.className = "profile-card profile-card-direct";
  directCard.innerHTML = `
    <div class="pname">
      <span class="chip"><span class="swatch swatch-direct"></span>Direct</span>
      ${isDefaultDirect ? '<span class="badge-default">Default</span>' : ""}
    </div>
    <div class="pmeta">Built-in — loads the site with no proxy at all</div>
    <div class="pmeta">Explicitly used by ${usedByDirect} rule(s)</div>
  `;
  grid.appendChild(directCard);

  if (!state.profiles.length) {
    const hint = document.createElement("div");
    hint.className = "muted";
    hint.style.marginTop = "10px";
    hint.textContent = "You haven't created any proxy profile yet. Create one to route specific sites through a proxy.";
    grid.appendChild(hint);
  }

  for (const p of state.profiles) {
    const card = document.createElement("div");
    card.className = "profile-card";
    const usedBy = state.rules.filter(r => r.profileId === p.id).length;
    const isDefault = state.defaultMode === p.id;
    card.innerHTML = `
      <div class="pname"><span class="chip"><span class="swatch" style="background:${p.color}"></span>${esc(p.name)}</span>${isDefault ? '<span class="badge-default">Default</span>' : ""}</div>
      <div class="pmeta">${esc(schemeLabel(p.scheme))}://${esc(p.host)}:${esc(String(p.port))}${p.username ? " (auth)" : ""}</div>
      <div class="pmeta">Used by ${usedBy} rule(s)</div>
      <div class="pactions">
        <button class="icon-only-btn" data-action="edit" data-id="${p.id}" title="Edit"><span class="ph-svg">${PH_ICONS.edit}</span></button>
        <button class="icon-only-btn danger-hover" data-action="delete" data-id="${p.id}" title="Delete"><span class="ph-svg">${PH_ICONS.trash}</span></button>
      </div>
    `;
    grid.appendChild(card);
  }
  grid.querySelectorAll("[data-action=edit]").forEach(el =>
    el.addEventListener("click", () => openProfileModal(el.dataset.id))
  );
  grid.querySelectorAll("[data-action=delete]").forEach(el =>
    el.addEventListener("click", async () => {
      const id = el.dataset.id;
      const usedBy = state.rules.filter(r => r.profileId === id).length;
      if (usedBy && !confirm(`This profile is used by ${usedBy} rule(s). Delete anyway?`)) return;
      state.profiles = state.profiles.filter(p => p.id !== id);
      if (state.defaultMode === id) state.defaultMode = PH_DIRECT_ID;
      await saveState();
      renderProfiles(); renderRuleTable(); fillDefaultModeSelect();
    })
  );
}

function fillDefaultModeSelect() {
  const sel = document.getElementById("defaultModeSelect");
  if (!sel) return;
  sel.innerHTML = `<option value="${PH_DIRECT_ID}">Direct (no proxy) — built-in</option>`;
  for (const p of state.profiles) {
    const opt = document.createElement("option");
    opt.value = p.id; opt.textContent = `${p.name} (${p.scheme}://${p.host}:${p.port})`;
    sel.appendChild(opt);
  }
  sel.value = state.defaultMode || PH_DIRECT_ID;
}

document.getElementById("defaultModeSelect").addEventListener("change", async (e) => {
  state.defaultMode = e.target.value;
  await saveState();
  renderProfiles();
});

function openProfileModal(profileId) {
  editingProfileId = profileId || null;
  const p = profileId ? state.profiles.find(x => x.id === profileId) : null;
  document.getElementById("profileModalTitle").textContent = p ? "Edit profile" : "New profile";
  document.getElementById("profName").value = p ? p.name : "";
  document.getElementById("profColor").value = p ? p.color : "#da7756";
  // "https" is a real, distinct proxy scheme (TLS to the proxy itself), but
  // it's rare and easily picked by mistake — it's surfaced as an advanced
  // checkbox under the merged "HTTP / HTTPS" option instead of its own
  // dropdown entry.
  const schemeIsHttps = p && p.scheme === "https";
  document.getElementById("profScheme").value = p ? (schemeIsHttps ? "http" : p.scheme) : "http";
  document.getElementById("profForceTls").checked = !!schemeIsHttps;
  document.getElementById("profHost").value = p ? p.host : "";
  document.getElementById("profPort").value = p ? p.port : "";
  document.getElementById("profUsername").value = p ? (p.username || "") : "";
  document.getElementById("profPassword").value = "";
  document.getElementById("profileModal").hidden = false;
  updateSchemeHint();
}

document.getElementById("addProfileBtn").addEventListener("click", () => openProfileModal(null));
document.getElementById("profCancelBtn").addEventListener("click", () => document.getElementById("profileModal").hidden = true);

const SCHEME_HINTS = {
  http: "Handles both http:// and https:// destination sites via CONNECT tunneling — this is what almost every proxy tool expects, including V2Ray/Xray \"mixed\" or \"http\" inbounds. Use this unless the checkbox below applies to you.",
  socks4: "SOCKS4 does not support UDP or remote DNS. If your tool supports SOCKS5, prefer that instead.",
  socks5: "SOCKS5 supports both TCP and remote DNS resolution — the most compatible option for most VPN/proxy tools.",
};
function updateSchemeHint() {
  const scheme = document.getElementById("profScheme").value;
  document.getElementById("schemeHint").textContent = SCHEME_HINTS[scheme] || "";
  document.getElementById("forceTlsRow").hidden = scheme !== "http";
}
document.getElementById("profScheme").addEventListener("change", updateSchemeHint);

document.getElementById("profSaveBtn").addEventListener("click", async () => {
  const name = document.getElementById("profName").value.trim();
  const color = document.getElementById("profColor").value;
  const schemeChoice = document.getElementById("profScheme").value;
  const scheme = (schemeChoice === "http" && document.getElementById("profForceTls").checked) ? "https" : schemeChoice;
  const host = document.getElementById("profHost").value.trim();
  const port = Number(document.getElementById("profPort").value);
  const username = document.getElementById("profUsername").value.trim();
  const rawPassword = document.getElementById("profPassword").value;
  if (!name || !host || !port) { alert("Name, host, and port are required."); return; }

  let profile = editingProfileId ? state.profiles.find(p => p.id === editingProfileId) : null;
  if (!profile) {
    profile = { id: uid() };
    state.profiles.push(profile);
  }
  Object.assign(profile, { name, color, scheme, host, port, username });

  if (rawPassword) {
    const vaultUnlocked = (await send({ type: "VAULT_IS_UNLOCKED" })).unlocked;
    if (vaultUnlocked) {
      const res = await send({ type: "ENCRYPT_SECRET", plainText: rawPassword });
      if (res.ok) {
        profile.encPassword = res.payload;
        delete profile.password;
      } else {
        profile.password = rawPassword;
        delete profile.encPassword;
      }
    } else {
      profile.password = rawPassword;
      delete profile.encPassword;
    }
  }

  await saveState();
  document.getElementById("profileModal").hidden = true;
  renderProfiles(); renderRuleTable(); fillDefaultModeSelect();
});

// ---------------- Vault ----------------

async function refreshVaultStatus() {
  const { unlocked } = await send({ type: "VAULT_IS_UNLOCKED" });
  const el = document.getElementById("vaultStatus");
  const hasPlainPasswords = state.profiles.some(p => p.password);
  if (unlocked) {
    el.innerHTML = `<span class="ph-svg">${PH_ICONS.unlock}</span>Vault unlocked — new passwords will be encrypted.`;
    el.className = "status-line ok";
  } else if (state.vault.saltB64) {
    el.innerHTML = `<span class="ph-svg">${PH_ICONS.lock}</span>Vault locked — unlock it to use proxies with a saved password.`;
    el.className = "status-line warn";
  } else {
    el.innerHTML = hasPlainPasswords
      ? `<span class="ph-svg">${PH_ICONS.warning}</span>Vault not set up — current passwords are stored as plain text.`
      : `<span class="ph-svg">${PH_ICONS.lock}</span>Vault not set up yet (optional).`;
    el.className = "status-line" + (hasPlainPasswords ? " warn" : "");
  }
}

document.getElementById("unlockVaultBtn").addEventListener("click", async () => {
  const pass = document.getElementById("vaultPassphrase").value;
  if (!pass) return;
  const res = await send({ type: "UNLOCK_VAULT", passphrase: pass });
  document.getElementById("vaultPassphrase").value = "";
  if (res.ok) {
    await loadState();
    refreshVaultStatus();
  } else {
    alert("Error unlocking Vault: " + res.error);
  }
});
document.getElementById("lockVaultBtn").addEventListener("click", async () => {
  await send({ type: "LOCK_VAULT" });
  refreshVaultStatus();
});

// ---------------- Import / Export ----------------

function fillBulkImportProfileSelect() {
  const sel = document.getElementById("bulkImportProfile");
  sel.innerHTML = `<option value="${PH_DIRECT_ID}">Direct (no proxy)</option>`;
  for (const p of state.profiles) {
    const opt = document.createElement("option");
    opt.value = p.id; opt.textContent = p.name;
    sel.appendChild(opt);
  }
}

document.getElementById("bulkImportBtn").addEventListener("click", async () => {
  const text = document.getElementById("bulkImportText").value;
  const defaultProfileId = document.getElementById("bulkImportProfile").value;
  if (!defaultProfileId) { alert("Create a profile first."); return; }
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  let added = 0;
  for (const line of lines) {
    const [patternsPart, profileNamePart] = line.split("\t");
    const patterns = patternsPart.split(",").map(p => p.trim()).filter(Boolean);
    if (!patterns.length) continue;
    let profileId = defaultProfileId;
    if (profileNamePart) {
      const match = state.profiles.find(p => p.name === profileNamePart.trim());
      if (match) profileId = match.id;
    }
    state.rules.push({ id: uid(), patterns, profileId, note: "bulk import" });
    added++;
  }
  await saveState();
  document.getElementById("bulkImportText").value = "";
  renderRuleTable(); renderAzNav();
  alert(`${added} rule(s) added.`);
});

document.getElementById("jsonImportBtn").addEventListener("click", () => document.getElementById("jsonImportFile").click());
document.getElementById("jsonImportFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    // When profiles are re-imported they get fresh ids (so they never collide
    // with existing ones), but every rule's profileId still points at the OLD
    // id from the export file. Without remapping, each imported rule ends up
    // pointing at a profile that no longer exists and silently falls back to
    // "routed"/default — which is exactly why roles had to be re-set by hand
    // after import. Build an old-id -> new-id map and rewrite rules through it.
    const idMap = {};
    if (Array.isArray(data.profiles)) {
      const newProfiles = data.profiles.map(p => {
        const newId = uid();
        if (p.id) idMap[p.id] = newId;
        return { ...p, id: newId };
      });
      state.profiles.push(...newProfiles);
    }
    if (Array.isArray(data.rules)) {
      state.rules.push(...data.rules.map(r => ({
        ...r,
        id: uid(),
        profileId: idMap[r.profileId] || r.profileId,
      })));
    }
    await saveState();
    renderProfiles(); renderRuleTable(); renderAzNav(); fillDefaultModeSelect();
    alert("Import completed.");
  } catch (err) {
    alert("Invalid JSON file: " + err);
  }
  e.target.value = "";
});

document.getElementById("exportJsonBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ profiles: state.profiles, rules: state.rules }, null, 2)],
    { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "proxyhub-export.json";
  a.click();
  URL.revokeObjectURL(url);
});

// ---------------- Diagnostics ----------------

async function refreshDiagnostics() {
  const statusEl = document.getElementById("diagStatus");
  const preEl = document.getElementById("diagPacScript");
  statusEl.textContent = "Checking…";
  statusEl.className = "status-line";
  const info = await send({ type: "GET_PAC_DEBUG" });
  if (!info) {
    statusEl.innerHTML = `<span class="ph-svg">${PH_ICONS.warning}</span>Could not reach the background service worker.`;
    statusEl.className = "status-line warn";
    preEl.textContent = "";
    return;
  }
  if (!info.enabled) {
    statusEl.innerHTML = `<span class="ph-svg">${PH_ICONS.power}</span>Routing is globally disabled — all traffic goes DIRECT.`;
    preEl.textContent = "";
    return;
  }
  const defaultProfile = info.defaultMode && info.defaultMode !== PH_DIRECT_ID
    ? profileById(info.defaultMode) : null;
  const defaultDesc = defaultProfile ? `the default proxy (${defaultProfile.name})` : "DIRECT";
  if (info.totalRules === 0) {
    statusEl.innerHTML = `<span class="ph-svg">${PH_ICONS.globe}</span>${defaultProfile ? `No rules yet — all unmatched traffic goes through ${esc(defaultDesc)}.` : "No rules yet — all traffic goes DIRECT."}`;
    preEl.textContent = info.pacScript || "";
    return;
  }
  if (info.usableRuleCount === 0) {
    statusEl.innerHTML = `<span class="ph-svg">${PH_ICONS.warning}</span>You have rules, but none are usable — every one points to a profile missing a host or port. Unmatched sites still go through ${esc(defaultDesc)}.`;
    statusEl.className = "status-line warn";
    preEl.textContent = info.pacScript || "";
    return;
  }
  statusEl.innerHTML = `<span class="ph-svg">${PH_ICONS.check}</span>${info.usableRuleCount} of ${info.totalRules} rule(s) are active in the PAC script below. Anything unmatched falls through to ${esc(defaultDesc)}.`;
  statusEl.className = "status-line ok";
  preEl.textContent = info.pacScript || "";
}

document.getElementById("refreshDiagBtn").addEventListener("click", refreshDiagnostics);

// ---------------- Live updates ----------------
PH_API.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[PH_STORAGE_KEY]) return;
  refreshLive();
});

async function refreshLive() {
  await loadState();
  renderMasterSwitch();
  renderRuleTable();
  renderAzNav();
  renderProfiles();
  fillDefaultModeSelect();
  fillBulkImportProfileSelect();
  if (document.getElementById("tab-vault").classList.contains("active")) refreshVaultStatus();
  if (document.getElementById("tab-importexport").classList.contains("active")) refreshDiagnostics();
  if (document.getElementById("tab-knownhosts").classList.contains("active")) renderKnownHosts();
}

// ---------------- Known hosts (customizable CDN database) ----------------

let editingGroupKey = null;

function ensureKnownHosts() {
  if (!state.knownHosts) state.knownHosts = { extraDomains: [], disabledDomains: [], customGroups: {}, disabledGroupKeys: [] };
  return state.knownHosts;
}

function renderKnownHosts() {
  const kh = ensureKnownHosts();
  document.getElementById("customCdnText").value = (kh.extraDomains || []).join("\n");
  renderBuiltinCdnList();
  renderGroupsTable();
}

function renderBuiltinCdnList() {
  const kh = ensureKnownHosts();
  const q = document.getElementById("builtinCdnSearch").value.trim().toLowerCase();
  const disabled = new Set(kh.disabledDomains || []);
  document.getElementById("builtinCdnCount").textContent = `(${KNOWN_CDN_DOMAINS.length} built-in)`;

  const list = document.getElementById("builtinCdnList");
  list.innerHTML = "";
  const visible = KNOWN_CDN_DOMAINS.filter(d => !disabled.has(d) && (!q || d.includes(q)));
  for (const d of visible) {
    const chip = document.createElement("span");
    chip.className = "host-chip";
    chip.title = "Click to hide from suggestions";
    chip.textContent = d;
    chip.addEventListener("click", async () => {
      kh.disabledDomains = [...new Set([...(kh.disabledDomains || []), d])];
      await saveState();
      renderBuiltinCdnList();
    });
    list.appendChild(chip);
  }

  const hiddenBox = document.getElementById("hiddenCdnBox");
  const hiddenList = (kh.disabledDomains || []);
  if (!hiddenList.length) { hiddenBox.innerHTML = ""; return; }
  hiddenBox.innerHTML = `<span class="muted">${hiddenList.length} hidden:</span>`;
  for (const d of hiddenList) {
    const chip = document.createElement("span");
    chip.className = "host-chip is-hidden";
    chip.title = "Click to restore";
    chip.textContent = d;
    chip.addEventListener("click", async () => {
      kh.disabledDomains = (kh.disabledDomains || []).filter(x => x !== d);
      await saveState();
      renderBuiltinCdnList();
    });
    hiddenBox.appendChild(chip);
  }
}

document.getElementById("builtinCdnSearch").addEventListener("input", renderBuiltinCdnList);

document.getElementById("saveCustomCdnBtn").addEventListener("click", async () => {
  const kh = ensureKnownHosts();
  kh.extraDomains = document.getElementById("customCdnText").value
    .split("\n").map(l => l.trim().toLowerCase()).filter(Boolean);
  await saveState();
  renderBuiltinCdnList();
});

function renderGroupsTable() {
  const kh = ensureKnownHosts();
  const disabledKeys = new Set(kh.disabledGroupKeys || []);
  const customKeys = new Set(Object.keys(kh.customGroups || {}));
  const merged = { ...DOMAIN_GROUPS, ...(kh.customGroups || {}) };
  const tbody = document.getElementById("groupsTableBody");
  tbody.innerHTML = "";

  for (const key of Object.keys(merged).sort()) {
    const isCustom = customKeys.has(key);
    const isHidden = !isCustom && disabledKeys.has(key);
    if (isHidden) continue; // hidden built-ins are just skipped from matching; still simplest to hide from the table too
    const group = merged[key];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="mono">${esc(key)}</td>
      <td>${esc(group.label || "")}${isCustom ? ' <span class="site-sub-count">custom</span>' : ""}</td>
      <td class="mono" style="font-size:11.5px; color:var(--text-dim);">${esc((group.patterns || []).join(", "))}</td>
      <td>
        <div class="row-actions">
          ${isCustom
            ? `<button class="icon-only-btn" data-action="edit-group" data-key="${esc(key)}" title="Edit"><span class="ph-svg">${PH_ICONS.edit}</span></button>
               <button class="icon-only-btn danger-hover" data-action="delete-group" data-key="${esc(key)}" title="Delete"><span class="ph-svg">${PH_ICONS.trash}</span></button>`
            : `<button class="icon-only-btn danger-hover" data-action="hide-group" data-key="${esc(key)}" title="Hide from suggestions"><span class="ph-svg">${PH_ICONS.close}</span></button>`}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll("[data-action=edit-group]").forEach(el =>
    el.addEventListener("click", () => openCdnGroupModal(el.dataset.key))
  );
  tbody.querySelectorAll("[data-action=delete-group]").forEach(el =>
    el.addEventListener("click", async () => {
      delete kh.customGroups[el.dataset.key];
      await saveState();
      renderGroupsTable();
    })
  );
  tbody.querySelectorAll("[data-action=hide-group]").forEach(el =>
    el.addEventListener("click", async () => {
      kh.disabledGroupKeys = [...new Set([...(kh.disabledGroupKeys || []), el.dataset.key])];
      await saveState();
      renderGroupsTable();
    })
  );
}

function openCdnGroupModal(key) {
  editingGroupKey = key || null;
  const kh = ensureKnownHosts();
  const group = key ? (kh.customGroups || {})[key] : null;
  document.getElementById("cdnGroupModalTitle").textContent = group ? "Edit CDN group" : "New CDN group";
  document.getElementById("cdnGroupKey").value = key || "";
  document.getElementById("cdnGroupKey").disabled = !!group;
  document.getElementById("cdnGroupLabel").value = group ? (group.label || "") : "";
  document.getElementById("cdnGroupPatterns").value = group ? (group.patterns || []).join("\n") : "";
  document.getElementById("cdnGroupModal").hidden = false;
}

document.getElementById("addGroupBtn2").addEventListener("click", () => openCdnGroupModal(null));
document.getElementById("cdnGroupCancelBtn").addEventListener("click", () => document.getElementById("cdnGroupModal").hidden = true);
document.getElementById("cdnGroupSaveBtn").addEventListener("click", async () => {
  const kh = ensureKnownHosts();
  const key = document.getElementById("cdnGroupKey").value.trim().toLowerCase().replace(/^\*\./, "");
  const label = document.getElementById("cdnGroupLabel").value.trim() || key;
  const patterns = document.getElementById("cdnGroupPatterns").value.split("\n").map(l => l.trim()).filter(Boolean);
  if (!key || !patterns.length) { alert("A site domain and at least one pattern are required."); return; }
  if (!kh.customGroups) kh.customGroups = {};
  if (editingGroupKey && editingGroupKey !== key) delete kh.customGroups[editingGroupKey];
  kh.customGroups[key] = { label, patterns };
  await saveState();
  document.getElementById("cdnGroupModal").hidden = true;
  renderGroupsTable();
});

// ---------------- Init ----------------

(async function init() {
  injectStaticIcons();
  await loadTheme();
  await loadState();
  renderMasterSwitch();
  renderRuleTable();
  renderAzNav();
  renderProfiles();
  fillDefaultModeSelect();
  fillBulkImportProfileSelect();
  refreshVaultStatus();
})();
