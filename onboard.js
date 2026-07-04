// onboard.js — first-run onboarding wizard, lives inside options.html.

const ONB_SEEN_KEY = "ph_onboarding_seen_v1";

const ONB_SLIDES = [
  {
    icon: "logo",
    title: "Welcome to ProxyHub",
    body: "Route different sites through different proxies, automatically — no fiddling with browser-wide settings. Here's a quick look at how it works.",
  },
  {
    icon: "plus",
    title: "Add a proxy",
    body: "Go to Proxy profiles and add your server's address, port, and login.",
  },
  {
    icon: "globe",
    title: "Route a site",
    body: "Click the ProxyHub icon on any site and pick which profile it should use.",
  },
  {
    icon: "gauge",
    title: "Icon meanings",
    body: "The toolbar icon always shows the current tab's state at a glance.",
    legend: [
      { img: "icons/icon-proxy48.png", label: "Proxied — routed through a profile" },
      { img: "icons/icon-direct48.png", label: "Direct — no proxy for this site" },
      { img: "icons/icon-off48.png", label: "Off — routing disabled" },
    ],
  },
  {
    icon: "link",
    title: "Smart suggestions",
    body: "Related CDN and media domains for a site get suggested automatically, so images, video, and login widgets don't silently break.",
  },
  {
    icon: "warning",
    title: "Auto-fix broken pages",
    body: "If a page looks broken, one click adds any missing rule and reloads it — no digging through DevTools required.",
    cta: "Add my first proxy",
  },
];

const ONB_UI = { back: "Back", next: "Next", done: "Get started" };

let onbIndex = 0;

function onbMarkSeen() {
  chrome.storage.local.set({ [ONB_SEEN_KEY]: true });
}

function onbClose() {
  document.getElementById("onbOverlay").hidden = true;
  onbMarkSeen();
}

function onbBuildSlides() {
  const track = document.getElementById("onbTrack");
  track.innerHTML = "";
  ONB_SLIDES.forEach((slide) => {
    const el = document.createElement("div");
    el.className = "onb-slide";

    const iconWrap = document.createElement("div");
    iconWrap.className = "onb-slide-icon";
    if (typeof PH_ICONS !== "undefined" && PH_ICONS[slide.icon]) {
      iconWrap.innerHTML = PH_ICONS[slide.icon];
    }
    el.appendChild(iconWrap);

    const h3 = document.createElement("h3");
    h3.textContent = slide.title;
    el.appendChild(h3);

    const p = document.createElement("p");
    p.textContent = slide.body;
    el.appendChild(p);

    if (slide.legend) {
      const legend = document.createElement("div");
      legend.className = "onb-legend";
      slide.legend.forEach((row) => {
        const r = document.createElement("div");
        r.className = "onb-legend-row";
        const img = document.createElement("img");
        img.src = row.img;
        const span = document.createElement("span");
        span.textContent = row.label;
        r.appendChild(img);
        r.appendChild(span);
        legend.appendChild(r);
      });
      el.appendChild(legend);
    }

    if (slide.cta) {
      const cta = document.createElement("button");
      cta.className = "onb-btn-primary";
      cta.style.marginTop = "16px";
      cta.style.width = "100%";
      cta.textContent = slide.cta;
      cta.addEventListener("click", () => {
        onbClose();
        const profilesTab = document.querySelector('.tab-btn[data-tab="profiles"]');
        if (profilesTab) profilesTab.click();
        const addBtn = document.getElementById("addProfileBtn");
        if (addBtn) addBtn.click();
      });
      el.appendChild(cta);
    }

    track.appendChild(el);
  });

  const dots = document.getElementById("onbDots");
  dots.innerHTML = "";
  ONB_SLIDES.forEach((_, i) => {
    const d = document.createElement("span");
    d.className = "onb-dot";
    d.addEventListener("click", () => onbGoTo(i));
    dots.appendChild(d);
  });
}

function onbRenderPosition() {
  const track = document.getElementById("onbTrack");
  track.style.transform = `translateX(${-onbIndex * 100}%)`;

  document.querySelectorAll(".onb-dot").forEach((d, i) => d.classList.toggle("active", i === onbIndex));

  const total = ONB_SLIDES.length;
  document.getElementById("onbPrev").hidden = onbIndex === 0;
  document.getElementById("onbPrev").textContent = ONB_UI.back;
  document.getElementById("onbNext").textContent = onbIndex === total - 1 ? ONB_UI.done : ONB_UI.next;
}

function onbGoTo(i) {
  const total = ONB_SLIDES.length;
  onbIndex = Math.max(0, Math.min(total - 1, i));
  onbRenderPosition();
}

function onbAttachSwipe() {
  const track = document.getElementById("onbTrack");
  let startX = 0, dx = 0, dragging = false, width = 1;

  const onDown = (x) => {
    dragging = true; startX = x; dx = 0;
    width = track.parentElement.getBoundingClientRect().width || 1;
    track.classList.add("onb-dragging");
  };
  const onMove = (x) => {
    if (!dragging) return;
    dx = x - startX;
    const base = -onbIndex * 100;
    const dragPct = (dx / width) * 100;
    track.style.transform = `translateX(${base + dragPct}%)`;
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("onb-dragging");
    const threshold = width * 0.18;
    if (Math.abs(dx) > threshold) {
      if (dx < 0) onbGoTo(onbIndex + 1); else onbGoTo(onbIndex - 1);
    } else {
      onbRenderPosition();
    }
  };

  track.addEventListener("pointerdown", (e) => onDown(e.clientX));
  track.addEventListener("pointermove", (e) => onMove(e.clientX));
  window.addEventListener("pointerup", onUp);
  track.addEventListener("pointerleave", (e) => { if (dragging && e.buttons === 0) onUp(); });
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get([ONB_SEEN_KEY], (res) => {
    if (res && res[ONB_SEEN_KEY]) return;

    document.getElementById("onbOverlay").hidden = false;
    const closeBtn = document.getElementById("onbClose");
    if (typeof PH_ICONS !== "undefined") closeBtn.innerHTML = PH_ICONS.close;
    closeBtn.addEventListener("click", onbClose);

    document.getElementById("onbPrev").addEventListener("click", () => onbGoTo(onbIndex - 1));
    document.getElementById("onbNext").addEventListener("click", () => {
      if (onbIndex === ONB_SLIDES.length - 1) onbClose(); else onbGoTo(onbIndex + 1);
    });

    onbBuildSlides();
    onbRenderPosition();
    onbAttachSwipe();
  });
});
