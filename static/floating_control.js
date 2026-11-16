/* LinkedIn Job Applier floating control center. Executed by Selenium after navigation. */
(() => {
  const config = window.__LINKEDIN_BOT_CONTROL_CONFIG__ || {};
  const hostId = "linkedin-job-applier-control-center";
  // Remove every historical in-page implementation before installing the isolated
  // version. Chrome's page restore can preserve an old LinkedIn DOM across runs.
  document.querySelectorAll("#linkedin-job-bot-control, #linkedin-job-bot-control-style, [id^='linkedin-job-bot-control']").forEach(node => node.remove());
  document.querySelectorAll("style").forEach(node => {
    const text = node.textContent || "";
    if (text.includes("linkedin-job-bot-control") || text.includes("Job Applier Bot")) node.remove();
  });
  const old = document.getElementById(hostId);
  if (old) old.remove();

  const host = document.createElement("div");
  host.id = hostId;
  host.setAttribute("aria-label", "Job Applier Bot control center");
  host.style.cssText = "position:fixed;top:82px;right:18px;width:40px;height:40px;box-sizing:border-box;z-index:2147483647;";
  const root = host.attachShadow({mode: "closed"});
  const css = `
      :host{all:initial}*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      #shell{width:40px;height:40px;color:#f8fbff;user-select:none;transition:width .18s ease,height .18s ease}
      #shell.open{width:340px;height:548px}.orb{display:grid;place-items:center;width:40px;height:40px;padding:0;border:0;border-radius:50%;background:linear-gradient(145deg,#173b70,#0e2345);color:#fff;box-shadow:0 5px 18px #00153085;cursor:pointer;font-size:18px}.open>.orb{display:none}
      .card{display:none;height:100%;overflow:hidden;border:1px solid #31517e;border-radius:16px;background:linear-gradient(155deg,#10284e,#0a1930);box-shadow:0 16px 40px #00153080}.open>.card{display:flex;flex-direction:column}
      .head{display:flex;align-items:center;gap:8px;padding:11px 12px 8px;border-bottom:1px solid #ffffff1f;cursor:grab}.head:active{cursor:grabbing}.head b{font-size:13px;letter-spacing:.1px}.head small{display:block;color:#b9cae5;font-size:10px}.spacer{flex:1}.icon{display:grid;place-items:center;width:27px;height:27px;padding:0;border:0;border-radius:50%;background:#ffffff1a;color:#fff;font-size:16px;cursor:pointer}
      .summary{padding:10px 12px 7px}.status{font-size:12px;font-weight:700}.meta{margin-top:3px;overflow:hidden;color:#b9cae5;font-size:10px;white-space:nowrap;text-overflow:ellipsis}.tabs{display:flex;gap:5px;padding:0 10px 9px;overflow:auto}.tab{border:1px solid #ffffff25;border-radius:999px;background:transparent;color:#cfdbed;padding:5px 8px;font-size:10px;white-space:nowrap;cursor:pointer}.tab.active{background:#4db6e8;color:#07213a;border-color:#4db6e8}
      .view{display:none;flex:1;min-height:0;padding:0 12px 12px;overflow:auto}.view.active{display:block}.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.action{border:0;border-radius:8px;background:#eef6ff;color:#10284e;padding:8px 7px;font-size:11px;font-weight:700;cursor:pointer}.action.warn{background:#ffd477}.action.stop{background:#ffaaa5}.field{width:100%;height:31px;margin:4px 0;border:1px solid #7191bc;border-radius:7px;padding:6px 8px;background:#fff;color:#10284e;font-size:11px}.checks{display:flex;gap:8px;flex-wrap:wrap;padding:5px 0;color:#dbe9fb;font-size:10px}.checks label{display:flex;align-items:center;gap:3px}.label{margin:8px 0 3px;color:#b9cae5;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.list{display:grid;grid-template-columns:1fr 1fr;gap:6px}.link{border:1px solid #ffffff2b;border-radius:8px;background:#ffffff10;color:#eaf4ff;padding:8px;text-align:left;font-size:11px;cursor:pointer}.log{height:118px;overflow:auto;border-radius:8px;background:#07152b;color:#c9ddf7;padding:8px;white-space:pre-wrap;font:10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace}.chat{display:flex;flex-direction:column;height:100%;gap:7px}.messages{flex:1;overflow:auto;border-radius:9px;background:#07152b;padding:8px}.msg{max-width:92%;margin:0 0 7px;padding:7px 8px;border-radius:9px;background:#183961;color:#eef7ff;font-size:11px;line-height:1.35}.msg.user{margin-left:auto;background:#3c92be}.chatrow{display:flex;gap:5px}.chatrow input{flex:1;height:32px;border:1px solid #7191bc;border-radius:8px;padding:6px 8px;font-size:11px}.chatrow button{border:0;border-radius:8px;background:#4db6e8;color:#06213b;padding:0 10px;font-weight:700;cursor:pointer}.empty{padding:18px 4px;color:#b9cae5;font-size:11px;text-align:center}
    `;
  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(css);
  root.adoptedStyleSheets = [stylesheet];
  document.documentElement.appendChild(host);

  const markup = `<div id="shell"><button class="orb" id="toggle" title="Open Job Applier controls" aria-label="Open Job Applier controls">✦</button><section class="card">
      <header class="head" id="drag"><button class="icon" id="collapse" title="Collapse">✦</button><div><b>Job Applier Copilot</b><small>local control center</small></div><span class="spacer"></span><button class="icon" id="full" title="Open full panel">↗</button></header>
      <div class="summary"><div class="status" id="status">Connecting…</div><div class="meta" id="meta">Loading local runtime state</div></div>
      <nav class="tabs"><button class="tab active" data-tab="run">Run</button><button class="tab" data-tab="search">Search</button><button class="tab" data-tab="copilot">Copilot</button><button class="tab" data-tab="data">Data</button><button class="tab" data-tab="settings">Settings</button></nav>
      <div class="view active" data-view="run"><div class="grid"><button class="action" data-action="pause">Pause</button><button class="action" data-action="resume">Resume</button><button class="action" data-action="refresh">Refresh search</button><button class="action stop" data-action="stop">Stop</button></div><div class="label">Live run</div><div class="grid"><button class="link" data-open="Run">Detailed run controls</button><button class="link" data-open="Analytics">Analytics dashboard</button></div></div>
      <div class="view" data-view="search"><input id="term" class="field" placeholder="Search term"><input id="location" class="field" placeholder="Location"><select id="timing" class="field"><option value="faster">Faster timing</option><option value="balanced">Balanced timing</option><option value="careful">Careful timing</option></select><div class="checks"><label><input id="easy" type="checkbox"> Easy Apply only</label><label><input id="ai" type="checkbox"> AI for unknown required answers</label></div><button class="action" id="applySearch">Apply on resume</button></div>
      <div class="view" data-view="copilot"><div class="chat"><div class="messages" id="messages"><div class="msg">I can pause or resume the bot, update search/location, show logs, open settings, and explain the latest run. Try “search Python developer in Indore”.</div></div><div class="chatrow"><input id="chatInput" placeholder="Ask the bot copilot"><button id="send">Send</button></div></div></div>
      <div class="view" data-view="data"><div class="label">Recent activity</div><pre class="log" id="logs">Loading…</pre><div class="label">Application history</div><div id="history" class="empty">Loading…</div></div>
      <div class="view" data-view="settings"><div class="list"><button class="link" data-open="Account">Account & AI provider</button><button class="link" data-open="Profile">Profile & answers</button><button class="link" data-open="Search">Search filters</button><button class="link" data-open="Filters">Job filters</button><button class="link" data-open="Run settings">Run settings</button><button class="link" data-open="Run">History & logs</button></div><div class="label">All settings open in the existing localhost panel</div></div>
    </section></div>`;
  const add = (parent, tag, props = {}, text = "") => {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value);
    });
    if (text) node.textContent = text;
    parent.appendChild(node);
    return node;
  };
  const shellNode = add(root, "div", {id: "shell"});
  add(shellNode, "button", {class: "orb", id: "toggle", title: "Open Job Applier controls", "aria-label": "Open Job Applier controls"}, "✦");
  const card = add(shellNode, "section", {class: "card"});
  const head = add(card, "header", {class: "head", id: "drag"});
  add(head, "button", {class: "icon", id: "collapse", title: "Collapse"}, "✦");
  const title = add(head, "div"); add(title, "b", {}, "Job Applier Copilot"); add(title, "small", {}, "local control center");
  add(head, "span", {class: "spacer"}); add(head, "button", {class: "icon", id: "full", title: "Open full panel"}, "↗");
  const summary = add(card, "div", {class: "summary"}); add(summary, "div", {class: "status", id: "status"}, "Connecting…"); add(summary, "div", {class: "meta", id: "meta"}, "Loading local runtime state");
  const tabs = add(card, "nav", {class: "tabs"});
  ["run", "search", "copilot", "data", "settings"].forEach((tab, index) => add(tabs, "button", {class: `tab${index === 0 ? " active" : ""}`, "data-tab": tab}, tab[0].toUpperCase() + tab.slice(1)));
  const view = (name, active = false) => add(card, "div", {class: `view${active ? " active" : ""}`, "data-view": name});
  const runView = view("run", true); const runGrid = add(runView, "div", {class: "grid"});
  [["pause", "Pause"], ["resume", "Resume"], ["refresh", "Refresh search"], ["stop", "Stop"]].forEach(([action, label]) => add(runGrid, "button", {class: `action${action === "stop" ? " stop" : ""}`, "data-action": action}, label));
  add(runView, "div", {class: "label"}, "Live run"); const links = add(runView, "div", {class: "grid"}); add(links, "button", {class: "link", "data-open": "Run"}, "Detailed run controls"); add(links, "button", {class: "link", "data-open": "Analytics"}, "Analytics dashboard");
  const searchView = view("search"); add(searchView, "input", {id: "term", class: "field", placeholder: "Search term"}); add(searchView, "input", {id: "location", class: "field", placeholder: "Location"});
  const timing = add(searchView, "select", {id: "timing", class: "field"}); [["faster", "Faster timing"], ["balanced", "Balanced timing"], ["careful", "Careful timing"]].forEach(([value, label]) => add(timing, "option", {value}, label));
  const checks = add(searchView, "div", {class: "checks"}); const easyLabel = add(checks, "label"); add(easyLabel, "input", {id: "easy", type: "checkbox"}); easyLabel.append(" Easy Apply only"); const aiLabel = add(checks, "label"); add(aiLabel, "input", {id: "ai", type: "checkbox"}); aiLabel.append(" AI for unknown required answers"); add(searchView, "button", {class: "action", id: "applySearch"}, "Apply on resume");
  const copilotView = view("copilot"); const chat = add(copilotView, "div", {class: "chat"}); const messages = add(chat, "div", {class: "messages", id: "messages"}); add(messages, "div", {class: "msg"}, "I can pause or resume the bot, update search/location, show logs, open settings, and explain the latest run."); const chatrow = add(chat, "div", {class: "chatrow"}); add(chatrow, "input", {id: "chatInput", placeholder: "Ask the bot copilot"}); add(chatrow, "button", {id: "send"}, "Send");
  const dataView = view("data"); add(dataView, "div", {class: "label"}, "Recent activity"); add(dataView, "pre", {class: "log", id: "logs"}, "Loading…"); add(dataView, "div", {class: "label"}, "Application history"); add(dataView, "div", {id: "history", class: "empty"}, "Loading…");
  const settingsView = view("settings"); const settingLinks = add(settingsView, "div", {class: "list"}); [["Account", "Account & AI provider"], ["Profile", "Profile & answers"], ["Search", "Search filters"], ["Filters", "Job filters"], ["Run settings", "Run settings"], ["Run", "History & logs"]].forEach(([tab, label]) => add(settingLinks, "button", {class: "link", "data-open": tab}, label)); add(settingsView, "div", {class: "label"}, "All settings open in the existing localhost panel");

  const q = selector => root.querySelector(selector);
  const on = (selector, event, handler) => {
    const node = q(selector);
    if (node) node.addEventListener(event, handler);
    return node;
  };
  const shell = q("#shell");
  const headers = {"Content-Type":"application/json", "X-Bot-Control-Token": config.token || ""};
  let state = {settings:{}, progress:{}};
  let logOffset = 0;
  const api = (path, options = {}) => fetch(`${config.baseUrl || "http://127.0.0.1:5001"}${path}`, options);
  const openFull = tab => window.open(`${config.baseUrl || "http://127.0.0.1:5001"}/?tab=${encodeURIComponent(tab || "Run")}`, "_blank", "noopener");
  const setOpen = open => {
    shell.classList.toggle("open", open);
    host.style.setProperty("width", open ? "340px" : "40px", "important");
    host.style.setProperty("height", open ? "548px" : "40px", "important");
  };
  const render = () => {
    const progress = state.progress || {}, settings = state.settings || {};
    q("#status").textContent = state.stop ? "Stopping" : state.paused ? "Paused" : (state.status || "Ready");
    q("#meta").textContent = `${state.current_job || "Waiting for a job"} · ${progress.applied || 0} applied · ${progress.skipped || 0} skipped · ${progress.unresolved || 0} unresolved`;
    q("#term").value = settings.search_term || ""; q("#location").value = settings.location || "";
    q("#timing").value = settings.timing_profile || "balanced"; q("#easy").checked = settings.easy_apply_only !== false; q("#ai").checked = settings.use_ai !== false;
  };
  const setRuntime = change => api("/api/runtime", {method:"POST", headers, body:JSON.stringify(change)}).then(r => r.ok ? r.json() : Promise.reject()).then(next => { state = next; render(); return next; }).catch(() => { q("#status").textContent = "Local control server unavailable"; });
  const refreshState = () => api("/api/runtime").then(r => r.json()).then(next => { state = next; render(); }).catch(() => {});
  const addMessage = (text, user) => { const node = document.createElement("div"); node.className = `msg${user ? " user" : ""}`; node.textContent = text; q("#messages").appendChild(node); q("#messages").scrollTop = q("#messages").scrollHeight; };
  const refreshData = () => {
    api(`/api/logs?offset=${logOffset}`).then(r => r.json()).then(data => { if (data.content) q("#logs").textContent = (q("#logs").textContent === "Loading…" ? "" : q("#logs").textContent) + data.content; logOffset = data.next_offset || logOffset; }).catch(() => {});
    api("/api/analytics").then(r => r.json()).then(data => { q("#history").textContent = `${data.total || 0} applications · ${data.easy_applied || 0} Easy Apply · ${data.pending || 0} pending`; }).catch(() => { q("#history").textContent = "History unavailable"; });
  };
  let ignoreCollapseUntil = 0;
  on("#toggle", "click", () => { ignoreCollapseUntil = performance.now() + 320; setOpen(true); refreshState(); });
  on("#collapse", "click", event => { event.stopPropagation(); if (performance.now() < ignoreCollapseUntil) return; setOpen(false); });
  on("#full", "click", () => openFull("Run"));
  root.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => { root.querySelectorAll(".tab").forEach(x => x.classList.remove("active")); root.querySelectorAll(".view").forEach(x => x.classList.remove("active")); tab.classList.add("active"); q(`[data-view="${tab.dataset.tab}"]`).classList.add("active"); if (tab.dataset.tab === "data") refreshData(); }));
  root.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => setRuntime({[button.dataset.action === "refresh" ? "refresh" : button.dataset.action === "pause" ? "paused" : button.dataset.action === "resume" ? "paused" : "stop"]: button.dataset.action === "pause" ? true : button.dataset.action === "resume" ? false : true, ...(button.dataset.action === "resume" ? {refresh:false} : {})})));
  root.querySelectorAll("[data-open]").forEach(button => button.addEventListener("click", () => openFull(button.dataset.open)));
  on("#applySearch", "click", () => setRuntime({paused:true, refresh:true, settings:{search_term:q("#term")?.value.trim() || "", location:q("#location")?.value.trim() || "", timing_profile:q("#timing")?.value || "balanced", easy_apply_only:q("#easy")?.checked !== false, use_ai:q("#ai")?.checked !== false}}));
  const sendChat = () => { const text = q("#chatInput").value.trim(); if (!text) return; q("#chatInput").value = ""; addMessage(text, true); api("/api/copilot", {method:"POST", headers, body:JSON.stringify({message:text})}).then(r => r.json()).then(reply => { addMessage(reply.reply || "I could not complete that request."); if (reply.runtime) { state = reply.runtime; render(); } if (reply.open_tab) openFull(reply.open_tab); }).catch(() => addMessage("The local control server is unavailable.")); };
  on("#send", "click", sendChat); on("#chatInput", "keydown", event => { if (event.key === "Enter") sendChat(); });

  let drag; const positionKey = "linkedinJobApplierControlPosition";
  const restore = () => { try { const p = JSON.parse(localStorage.getItem(positionKey)); if (p && Number.isFinite(p.left) && Number.isFinite(p.top)) { host.style.left = `${p.left}px`; host.style.top = `${p.top}px`; host.style.right = "auto"; } } catch (_) {} };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  on("#drag", "pointerdown", event => { if (event.target.closest("button")) return; const rect = host.getBoundingClientRect(); drag = {id:event.pointerId, x:event.clientX, y:event.clientY, left:rect.left, top:rect.top, moved:false}; event.currentTarget.setPointerCapture(event.pointerId); });
  on("#drag", "pointermove", event => { if (!drag || drag.id !== event.pointerId) return; const dx = event.clientX - drag.x, dy = event.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) < 4) return; drag.moved = true; host.style.left = `${clamp(drag.left + dx, 4, innerWidth - host.offsetWidth - 4)}px`; host.style.top = `${clamp(drag.top + dy, 4, innerHeight - host.offsetHeight - 4)}px`; host.style.right = "auto"; });
  on("#drag", "pointerup", event => { if (!drag || drag.id !== event.pointerId) return; if (drag.moved) localStorage.setItem(positionKey, JSON.stringify({left:parseFloat(host.style.left), top:parseFloat(host.style.top)})); drag = null; });
  restore(); refreshState(); setInterval(refreshState, 1500);
})();
