// lib/groups.js
// Two databases live here:
//
// 1) DOMAIN_GROUPS — "site -> companion CDN/media domains" map.
//    When the user adds a base domain that matches one of these keys,
//    the UI offers to add the companion wildcard patterns in one click,
//    so media/CDN requests (thumbnails, video, images, avatars...) are
//    routed through the same proxy instead of silently failing.
//
// 2) KNOWN_CDN_DOMAINS — a large, generic list of widely-used CDN /
//    third-party asset providers. Used by the failed-resource watcher
//    (content.js) to recognize *any* site's broken CDN links, even for
//    sites that aren't in DOMAIN_GROUPS, and to label them nicely.
//
// Patterns use PAC-style wildcards (shExpMatch syntax): "*" matches any run of chars.

const DOMAIN_GROUPS = {
  "youtube.com": {
    label: "YouTube",
    patterns: [
      "youtube.com", "*.youtube.com",
      "*.ytimg.com", "*.googlevideo.com", "*.ggpht.com",
      "youtu.be", "*.youtu.be"
    ]
  },
  "instagram.com": {
    label: "Instagram",
    patterns: [
      "instagram.com", "*.instagram.com",
      "*.cdninstagram.com", "*.fbcdn.net"
    ]
  },
  "facebook.com": {
    label: "Facebook",
    patterns: [
      "facebook.com", "*.facebook.com",
      "*.fbcdn.net", "*.fbsbx.com"
    ]
  },
  "twitter.com": {
    label: "Twitter / X",
    patterns: [
      "twitter.com", "*.twitter.com", "x.com", "*.x.com",
      "*.twimg.com"
    ]
  },
  "tiktok.com": {
    label: "TikTok",
    patterns: [
      "tiktok.com", "*.tiktok.com",
      "*.tiktokcdn.com", "*.tiktokcdn-us.com", "*.muscdn.com", "*.ibyteimg.com"
    ]
  },
  "reddit.com": {
    label: "Reddit",
    patterns: [
      "reddit.com", "*.reddit.com",
      "*.redditstatic.com", "*.redditmedia.com", "*.redd.it"
    ]
  },
  "twitch.tv": {
    label: "Twitch",
    patterns: [
      "twitch.tv", "*.twitch.tv",
      "*.jtvnw.net", "*.ttvnw.net"
    ]
  },
  "netflix.com": {
    label: "Netflix",
    patterns: [
      "netflix.com", "*.netflix.com",
      "*.nflxvideo.net", "*.nflximg.net", "*.nflxext.com"
    ]
  },
  "amazon.com": {
    label: "Amazon",
    patterns: [
      "amazon.com", "*.amazon.com",
      "*.media-amazon.com", "*.ssl-images-amazon.com", "*.amazonaws.com"
    ]
  },
  "google.com": {
    label: "Google (search / photos / static)",
    patterns: [
      "google.com", "*.google.com",
      "*.gstatic.com", "*.googleusercontent.com", "*.googleapis.com"
    ]
  },
  "discord.com": {
    label: "Discord",
    patterns: [
      "discord.com", "*.discord.com", "discord.gg",
      "*.discordapp.com", "*.discordapp.net"
    ]
  },
  "spotify.com": {
    label: "Spotify",
    patterns: [
      "spotify.com", "*.spotify.com",
      "*.scdn.co"
    ]
  },
  "linkedin.com": {
    label: "LinkedIn",
    patterns: [
      "linkedin.com", "*.linkedin.com",
      "*.licdn.com"
    ]
  },
  "pinterest.com": {
    label: "Pinterest",
    patterns: [
      "pinterest.com", "*.pinterest.com",
      "*.pinimg.com"
    ]
  },
  "web.whatsapp.com": {
    label: "WhatsApp Web",
    patterns: [
      "web.whatsapp.com", "*.whatsapp.com", "*.whatsapp.net"
    ]
  },
  "web.telegram.org": {
    label: "Telegram Web",
    patterns: [
      "web.telegram.org", "*.telegram.org", "*.t.me", "*.telesco.pe"
    ]
  },
  "github.com": {
    label: "GitHub",
    patterns: [
      "github.com", "*.github.com",
      "*.githubusercontent.com", "*.githubassets.com", "*.github.io"
    ]
  },
  "vimeo.com": {
    label: "Vimeo",
    patterns: ["vimeo.com", "*.vimeo.com", "*.vimeocdn.com"]
  },
  "soundcloud.com": {
    label: "SoundCloud",
    patterns: ["soundcloud.com", "*.soundcloud.com", "*.sndcdn.com"]
  },
  "medium.com": {
    label: "Medium",
    patterns: ["medium.com", "*.medium.com", "*.miro.medium.com"]
  },
  "wikipedia.org": {
    label: "Wikipedia",
    patterns: ["wikipedia.org", "*.wikipedia.org", "*.wikimedia.org"]
  },
  "yahoo.com": {
    label: "Yahoo",
    patterns: ["yahoo.com", "*.yahoo.com", "*.yimg.com"]
  },
  "microsoft.com": {
    label: "Microsoft",
    patterns: ["microsoft.com", "*.microsoft.com", "*.msftauth.net", "*.msecnd.net", "*.live.com"]
  },
  "apple.com": {
    label: "Apple",
    patterns: ["apple.com", "*.apple.com", "*.mzstatic.com", "*.icloud.com"]
  },
  "shopify.com": {
    label: "Shopify stores",
    patterns: ["*.myshopify.com", "*.shopifycdn.com", "*.shopify.com"]
  },
  "wordpress.com": {
    label: "WordPress",
    patterns: ["wordpress.com", "*.wordpress.com", "*.wp.com", "*.gravatar.com"]
  },
  "steam": {
    label: "Steam",
    patterns: ["steampowered.com", "*.steampowered.com", "*.steamstatic.com", "*.akamaihd.net"]
  }
};

// Given a base pattern the user typed (e.g. "youtube.com" or "www.youtube.com"),
// find a matching known group key by suffix comparison. `overrides` (optional)
// is state.knownHosts — lets user-added custom groups win and user-hidden
// built-in groups be skipped, without touching the built-in DOMAIN_GROUPS map.
function findGroupForPattern(pattern, overrides) {
  const clean = pattern.replace(/^\*\./, "").toLowerCase();
  const customGroups = (overrides && overrides.customGroups) || {};
  const disabledKeys = new Set((overrides && overrides.disabledGroupKeys) || []);
  const merged = { ...DOMAIN_GROUPS, ...customGroups };
  for (const key of Object.keys(merged)) {
    if (disabledKeys.has(key) && !customGroups[key]) continue;
    if (clean === key || clean.endsWith("." + key)) {
      return { key, ...merged[key] };
    }
  }
  return null;
}

// ---------------------------------------------------------------------
// KNOWN_CDN_DOMAINS — big generic CDN / third-party asset provider list.
// Each entry is a bare domain (matched as itself and as any subdomain).
// Grouped by category purely for readability; matching is flat.
// ---------------------------------------------------------------------
const KNOWN_CDN_DOMAINS = [
  // General-purpose CDNs
  "cloudflare.com", "cdnjs.cloudflare.com", "cloudflareinsights.com", "cloudflarestream.com",
  "akamai.net", "akamaized.net", "akamaihd.net", "akamaiedge.net",
  "fastly.net", "fastlylb.net", "global.ssl.fastly.net",
  "jsdelivr.net", "cdn.jsdelivr.net", "unpkg.com",
  "bunny.net", "b-cdn.net", "bunnycdn.com",
  "stackpathcdn.com", "stackpath.bootstrapcdn.com", "highwinds.com",
  "keycdn.com", "kxcdn.com",
  "edgecastcdn.net", "cdnetworks.com", "limelight.com", "llnwd.net",
  "cachefly.net", "swiftcdn.com", "azureedge.net", "vo.msecnd.net",
  "cloudfront.net", "amazonaws.com", "s3.amazonaws.com",
  "googleapis.com", "gstatic.com", "googleusercontent.com", "storage.googleapis.com",
  "googletagmanager.com", "google-analytics.com", "doubleclick.net",
  "netdna-cdn.com", "netdna-ssl.com", "maxcdn.bootstrapcdn.com",
  "cdn.shopify.com", "shopifycdn.com",
  "cdn.contentful.com", "images.contentful.com",
  "wp.com", "gravatar.com", "w.org",
  "polyfill.io", "code.jquery.com",
  "fontawesome.com", "kit.fontawesome.com", "use.fontawesome.com",
  "fonts.googleapis.com", "fonts.gstatic.com", "typekit.net", "use.typekit.net",
  "bootstrapcdn.com",
  "imgix.net", "cloudinary.com", "res.cloudinary.com",
  "unsplash.com", "images.unsplash.com", "pexels.com", "images.pexels.com",
  "giphy.com", "media.giphy.com",
  // Analytics / tracking / support widgets (also often break silently behind a proxy)
  "segment.com", "segment.io", "cdn.segment.com",
  "sentry.io", "browser.sentry-cdn.com",
  "hotjar.com", "static.hotjar.com",
  "intercom.io", "widget.intercom.io", "intercomcdn.com",
  "zendesk.com", "zdassets.com", "static.zdassets.com",
  "drift.com", "js.driftt.com",
  "hubspot.com", "hs-scripts.com", "hsforms.net", "hscta.net",
  "mixpanel.com", "cdn.mxpnl.com",
  "amplitude.com", "cdn.amplitude.com",
  "newrelic.com", "js-agent.newrelic.com", "nr-data.net",
  "optimizely.com", "cdn.optimizely.com",
  "cloudflare-insights.com",
  // Payments / auth widgets
  "stripe.com", "js.stripe.com", "m.stripe.network",
  "paypal.com", "paypalobjects.com",
  "recaptcha.net", "gstatic.com/recaptcha", "hcaptcha.com",
  "auth0.com", "cdn.auth0.com",
  // Social embeds / widgets
  "disqus.com", "disquscdn.com",
  "vimeocdn.com",
  "twimg.com",
  "fbcdn.net", "fbsbx.com",
  "licdn.com",
  "pinimg.com",
  "redditstatic.com", "redditmedia.com",
  "tiktokcdn.com", "tiktokcdn-us.com", "muscdn.com",
  "ytimg.com", "googlevideo.com", "ggpht.com",
  "scdn.co",
  "sndcdn.com",
  // Ad networks (frequently on the "why did this thumbnail not load" list)
  "adnxs.com", "criteo.com", "criteo.net", "taboola.com", "outbrain.com",
  "moatads.com", "adsrvr.org", "rubiconproject.com", "pubmatic.com", "openx.net"
];

// Suffix-match a hostname against the known CDN list. Returns the matched
// base domain (e.g. "cloudfront.net") or null. `overrides` (optional) is
// state.knownHosts.
function findKnownCdnDomain(host, overrides) {
  if (!host) return null;
  const clean = host.toLowerCase();
  const extra = (overrides && overrides.extraDomains) || [];
  const disabled = new Set((overrides && overrides.disabledDomains) || []);
  for (const base of KNOWN_CDN_DOMAINS) {
    if (disabled.has(base)) continue;
    if (clean === base || clean.endsWith("." + base)) return base;
  }
  for (const base of extra) {
    if (clean === base || clean.endsWith("." + base)) return base;
  }
  return null;
}

function defaultKnownHosts() {
  return { extraDomains: [], disabledDomains: [], customGroups: {}, disabledGroupKeys: [] };
}

if (typeof module !== "undefined") {
  module.exports = { DOMAIN_GROUPS, findGroupForPattern, KNOWN_CDN_DOMAINS, findKnownCdnDomain, defaultKnownHosts };
}
