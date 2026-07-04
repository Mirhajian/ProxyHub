// lib/icons.js — every visual glyph in ProxyHub's UI (popup, options, the
// in-page banner) comes from this file as inline SVG strings using
// `currentColor`.
const PH_ICONS = {
  logo: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.4 19.2 5.4V11c0 5.7-3 9.5-7.2 10.8C7.8 20.5 4.8 16.7 4.8 11V5.4L12 2.4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
    <circle cx="8" cy="15.6" r="1.15" fill="currentColor"/>
    <path d="M8 15.6 8 12 12 12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    <path d="M12 12 16 12 16 8.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14.3 9.2 16 7.2 17.7 9.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  proxy: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.4 19.2 5.4V11c0 5.7-3 9.5-7.2 10.8C7.8 20.5 4.8 16.7 4.8 11V5.4L12 2.4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
    <circle cx="8" cy="15.6" r="1.15" fill="currentColor"/>
    <path d="M8 15.6 8 12 12 12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    <path d="M12 12 16 12 16 8.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14.3 9.2 16 7.2 17.7 9.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  direct: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="12" r="1.8" fill="currentColor"/>
    <path d="M8.5 12H18M18 12l-3.4-3.4M18 12l-3.4 3.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  power: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3.5v7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M7 5.5a8 8 0 1 0 10 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 14.2A8.5 8.5 0 1 1 9.8 4a7 7 0 0 0 10.2 10.2Z" fill="currentColor"/>
  </svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="4.2" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5"/>
      <path d="M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6"/>
    </g>
  </svg>`,
  reload: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 11a8 8 0 1 0-2.3 6.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M20 5v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20l.9-4L16.6 4.3a1.8 1.8 0 0 1 2.6 0l.5.5a1.8 1.8 0 0 1 0 2.6L8 19.1 4 20Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M14.6 6.3l3.1 3.1" stroke="currentColor" stroke-width="1.8"/>
  </svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 7h14M9.5 7V5.2c0-.7.5-1.2 1.2-1.2h2.6c.7 0 1.2.5 1.2 1.2V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6.5 7 7.3 19a1.6 1.6 0 0 0 1.6 1.5h6.2A1.6 1.6 0 0 0 16.7 19L17.5 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10.2 10.7v6M13.8 10.7v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5.5 15.5 12 8 18.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4.5v15M4.5 12h15" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>
  </svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3.6 21.5 20H2.5L12 3.6Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M12 9.6v4.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="12" cy="16.9" r="1" fill="currentColor"/>
  </svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" stroke="currentColor" stroke-width="1.8"/>
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" stroke="currentColor" stroke-width="1.8"/>
  </svg>`,
  unlock: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" stroke="currentColor" stroke-width="1.8"/>
    <path d="M8 10.5V7.8a4 4 0 0 1 7.6-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" stroke-width="1.8"/>
    <path d="M15.6 15.6 20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.5 14.5 14.5 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M11 6.5 13 4.6a3.6 3.6 0 0 1 5.1 5.1L16.2 11.6M13 17.5l-2 1.9a3.6 3.6 0 0 1-5.1-5.1l1.9-1.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  layers: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3.5 21 8.2 12 12.9 3 8.2 12 3.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M3 13l9 4.7 9-4.7M3 17.8l9 4.7 9-4.7" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
  </svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.7"/>
    <path d="M3.5 12h17M12 3.5c2.4 2.3 3.7 5.3 3.7 8.5S14.4 18.2 12 20.5C9.6 18.2 8.3 15.2 8.3 12S9.6 5.8 12 3.5Z" stroke="currentColor" stroke-width="1.7"/>
  </svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3.5v11.5M7.5 11l4.5 4.5L16.5 11" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4.5 17.5v1.8a2.2 2.2 0 0 0 2.2 2.2h10.6a2.2 2.2 0 0 0 2.2-2.2v-1.8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
  </svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 19.5V8M7.5 12l4.5-4.5L16.5 12" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4.5 17.5v1.8a2.2 2.2 0 0 0 2.2 2.2h10.6a2.2 2.2 0 0 0 2.2-2.2v-1.8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
  </svg>`,
  gauge: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 16a8 8 0 1 1 16 0" stroke="currentColor" stroke-width="1.8"/>
    <path d="M12 16 15.3 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="12" cy="16" r="1.3" fill="currentColor"/>
  </svg>`,
};

function phIcon(name, cls) {
  return `<span class="ph-svg${cls ? " " + cls : ""}">${PH_ICONS[name] || ""}</span>`;
}

if (typeof module !== "undefined") {
  module.exports = { PH_ICONS, phIcon };
}
