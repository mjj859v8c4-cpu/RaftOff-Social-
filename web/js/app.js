(function () {
  "use strict";

  var CHECKIN_KEY = "raftoff-checkins-v3";
  var FEED_KEY = "raftoff-feed-v3";
  var EVENT_KEY = "raftoff-events-v3";
  var ACTIVE_KEY = "raftoff-active-checkin-v3";

  var VIBES = [
    { id: "party", label: "Party", color: "#ff6b8a" },
    { id: "chill", label: "Chill", color: "#5ec8ff" },
    { id: "family", label: "Family", color: "#7bd389" },
    { id: "fishing", label: "Fishing", color: "#56c7b0" },
    { id: "sports", label: "Watersports", color: "#f5a623" },
    { id: "food", label: "Food", color: "#e8c36a" },
  ];

  /** Corey's verified Lake St. Clair hotspots (USGS / NOAA Chart 14850/14852) */
  var PLACES = [
    { id: "strawberry-island", name: "Strawberry Island", lat: 42.5981, lng: -82.7094, type: "sandbar" },
    { id: "gull-island", name: "Gull Island", lat: 42.5303, lng: -82.6821, type: "sandbar" },
    { id: "jobbie-nooner-area", name: "Jobbie Nooner Area", lat: 42.538, lng: -82.6766, type: "sandbar" },
    { id: "grassy-island", name: "Grassy Island", lat: 42.6044, lng: -82.6583, type: "sandbar" },
    { id: "anchor-bay", name: "Anchor Bay", lat: 42.65, lng: -82.7166, type: "anchorage" },
    { id: "big-muscamoot-bay", name: "Big Muscamoot Bay", lat: 42.5578, lng: -82.6607, type: "anchorage" },
    { id: "little-muscamoot-bay", name: "Little Muscamoot Bay", lat: 42.5781, lng: -82.626, type: "anchorage" },
    { id: "goose-bay", name: "Goose Bay", lat: 42.5845, lng: -82.6791, type: "anchorage" },
    { id: "fisher-bay", name: "Fisher Bay", lat: 42.6067, lng: -82.651, type: "anchorage" },
    { id: "metro-beach", name: "Metro Beach", lat: 42.5819, lng: -82.8098, type: "beach" },
    { id: "harsens-island", name: "Harsens Island", lat: 42.5895, lng: -82.5885, type: "beach" },
    { id: "grosse-pointe-shoreline", name: "Grosse Pointe Shoreline", lat: 42.3967, lng: -82.8885, type: "beach" },
    { id: "st-clair-shores-marina", name: "St. Clair Shores Marina", lat: 42.493, lng: -82.887, type: "marina" },
    { id: "jefferson-beach-marina", name: "Jefferson Beach Marina", lat: 42.4723, lng: -82.8885, type: "marina" },
    { id: "emerald-city-harbor", name: "Emerald City Harbor", lat: 42.4683, lng: -82.8839, type: "marina" },
    { id: "macray-harbor", name: "MacRay Harbor", lat: 42.568, lng: -82.832, type: "marina" },
    { id: "belle-maer-harbor", name: "Belle Maer Harbor", lat: 42.6145, lng: -82.7865, type: "marina" },
    { id: "harley-ensign-memorial", name: "Harley Ensign Memorial", lat: 42.5933, lng: -82.7747, type: "launch" },
    { id: "selfridge-area", name: "Selfridge Area", lat: 42.605, lng: -82.8347, type: "launch" },
    { id: "fair-haven", name: "Fair Haven", lat: 42.6792, lng: -82.65, type: "launch" },
    { id: "st-clair-flats", name: "St. Clair Flats", lat: 42.5959, lng: -82.6327, type: "flats" },
    { id: "north-channel", name: "North Channel", lat: 42.6102, lng: -82.6075, type: "channel" },
    { id: "middle-channel", name: "Middle Channel", lat: 42.5795, lng: -82.5675, type: "channel" },
    { id: "south-channel", name: "South Channel", lat: 42.5334, lng: -82.6707, type: "channel" },
    { id: "st-clair-river-entrance", name: "St. Clair River Entrance", lat: 42.618, lng: -82.6, type: "channel" },
    { id: "detroit-river-entrance", name: "Detroit River Entrance", lat: 42.372, lng: -82.918, type: "channel" },
  ];

  /**
   * Partner bars & restaurants — differentiated for B2B (“you’re on RaftOff”).
   * partnerTier: featured (ad pitch) | listed (free presence / upsell)
   */
  var DINING = [
    { id: "scotty-simpsons", name: "Scotty Simpson’s Fish & Chips", lat: 42.4732, lng: -82.8794, type: "waterfront_dining", category: "Dock & dine", partnerTier: "featured", note: "Nautical Mile classic", pitch: "Dock-and-dine landmark on the Mile — featured partner placement." },
    { id: "bliss-nautical-mile", name: "Bliss", lat: 42.4761, lng: -82.8812, type: "nightlife", category: "Nightlife", partnerTier: "featured", note: "Nautical Mile nightlife", pitch: "Prime nightlife pin — reach boaters before they pick a dock." },
    { id: "brownies-on-the-lake", name: "Brownie’s on the Lake", lat: 42.4788, lng: -82.8825, type: "waterfront_dining", category: "Dock & dine", partnerTier: "featured", note: "SCS waterfront", pitch: "Waterfront patio energy — featured in Bars & food." },
    { id: "lucianos-on-the-mile", name: "Luciano’s Italian Restaurant", lat: 42.4745, lng: -82.8801, type: "restaurant", category: "Restaurant", partnerTier: "listed", note: "Nautical Mile", pitch: "Listed on RaftOff — upgrade to Featured for map priority." },
    { id: "mad-crab-scs", name: "Mad Crab", lat: 42.4812, lng: -82.884, type: "restaurant", category: "Restaurant", partnerTier: "listed", note: "SCS seafood", pitch: "Seafood stop for crews coming off the lake." },
    { id: "pat-obriens-scs", name: "Pat O’Brien’s Bar & Grill", lat: 42.4705, lng: -82.8778, type: "bar", category: "Bar", partnerTier: "listed", note: "SCS bar", pitch: "Après-anchor bar pin for Mile traffic." },
    { id: "lakeside-bar-grill", name: "Lakeside Bar & Grill", lat: 42.492, lng: -82.8865, type: "bar", category: "Bar", partnerTier: "listed", note: "Jefferson Beach corridor", pitch: "Marina-adjacent listing for dockside crews." },
    { id: "deck-at-macray", name: "The Deck at MacRay Harbor", lat: 42.5685, lng: -82.8315, type: "waterfront_dining", category: "Dock & dine", partnerTier: "featured", note: "MacRay Harbor", pitch: "Harbor patio — featured dock-and-dine placement." },
    { id: "cj-barrymores", name: "C.J. Barrymore’s", lat: 42.5895, lng: -82.8355, type: "nightlife", category: "Nightlife", partnerTier: "listed", note: "Harrison Twp", pitch: "Large-venue nightlife pin for lake-day spillover." },
    { id: "the-wharf-st-clair", name: "The Wharf Restaurant", lat: 42.8265, lng: -82.4865, type: "waterfront_dining", category: "Dock & dine", partnerTier: "featured", note: "St. Clair riverfront", pitch: "Riverfront dining — north-lake featured partner." },
    { id: "gilberts-lodge", name: "Gilbert’s Lodge", lat: 42.824, lng: -82.489, type: "restaurant", category: "Restaurant", partnerTier: "listed", note: "St. Clair", pitch: "Town dining listing for St. Clair day-trippers." },
    { id: "tin-fish-new-baltimore", name: "Tin Fish", lat: 42.6815, lng: -82.7368, type: "waterfront_dining", category: "Dock & dine", partnerTier: "featured", note: "New Baltimore · Anchor Bay", pitch: "Anchor Bay waterfront — featured for north-bay boaters." },
    { id: "pinkeys-boulevard-inn", name: "Pinkey’s Boulevard Inn", lat: 42.821, lng: -82.4925, type: "restaurant", category: "Restaurant", partnerTier: "listed", note: "St. Clair", pitch: "Historic inn dining — listed partner presence." },
    { id: "surfside-bar-grill", name: "Surfside Bar & Grill", lat: 42.6155, lng: -82.7875, type: "bar", category: "Bar", partnerTier: "listed", note: "Near Belle Maer", pitch: "Bay-side bar listing for post-raft crews." },
  ];

  var ALL_PLACES = PLACES.concat(DINING);

  var LAKE_FRAME = {
    center: [-82.7, 42.505],
    sw: [-82.98, 42.33],
    ne: [-82.42, 42.705],
  };

  var TYPE_COLORS = {
    sandbar: "#FF3D82",
    anchorage: "#2EF2C8",
    beach: "#5ec8ff",
    marina: "#f5a623",
    launch: "#e8c36a",
    flats: "#56c7b0",
    channel: "#a78bfa",
    bar: "#f0a04b",
    restaurant: "#e8c36a",
    waterfront_dining: "#ffb347",
    nightlife: "#e879f9",
  };

  var mapLayerFilter = "all"; /* all | hotspots | dining */

  var seedCheckins = [
    {
      id: "c1",
      author: "Maya",
      placeId: "strawberry-island",
      vibe: "party",
      message: "Raft-up growing — good music, friendly crews.",
      audience: "public",
      precision: "place",
      createdAt: Date.now() - 12 * 60000,
      endsAt: Date.now() + 90 * 60000,
      toFeed: true,
    },
    {
      id: "c2",
      author: "Jordan",
      placeId: "st-clair-flats",
      vibe: "fishing",
      message: "Walleye reports in the flats — approximate zone only.",
      audience: "public",
      precision: "approx",
      createdAt: Date.now() - 35 * 60000,
      endsAt: Date.now() + 60 * 60000,
      toFeed: true,
    },
    {
      id: "c3",
      author: "Sam",
      placeId: "metro-beach",
      vibe: "family",
      message: "Calm water, kids swimming near the beach zone.",
      audience: "public",
      precision: "place",
      createdAt: Date.now() - 50 * 60000,
      endsAt: Date.now() + 70 * 60000,
      toFeed: true,
    },
    {
      id: "c4",
      author: "Alex",
      placeId: "gull-island",
      vibe: "chill",
      message: "Quiet afternoon float. Room to hang.",
      audience: "public",
      precision: "place",
      createdAt: Date.now() - 8 * 60000,
      endsAt: Date.now() + 110 * 60000,
      toFeed: true,
    },
    {
      id: "c5",
      author: "Riley",
      placeId: "jefferson-beach-marina",
      vibe: "food",
      message: "Dockside bites before we head out.",
      audience: "followers",
      precision: "place",
      createdAt: Date.now() - 20 * 60000,
      endsAt: Date.now() + 40 * 60000,
      toFeed: true,
    },
  ];

  /** Demo profiles for check-in authors (web preview — no live API) */
  var DEMO_PROFILES = {
    Maya: {
      username: "maya_on_the_lake",
      boat: "Sea Ray 250 SLX",
      interests: ["Party", "Music", "Raft-ups"],
    },
    Jordan: {
      username: "jordan_walleye",
      boat: "Lund 1875 Pro-V",
      interests: ["Fishing", "Flats", "Early mornings"],
    },
    Sam: {
      username: "sam_family_float",
      boat: "Bennington 22 SS",
      interests: ["Family", "Beach days", "Swimming"],
    },
    Alex: {
      username: "alex_chill_cove",
      boat: "Pontoon · 24ft",
      interests: ["Chill", "Sunset floats", "Reading"],
    },
    Riley: {
      username: "riley_dockside",
      boat: null,
      interests: ["Food", "Dock & dine", "Marina life"],
    },
    You: {
      username: "raftoff_you",
      boat: "Your boat",
      interests: ["Social boating", "Fishing", "Family"],
    },
  };

  var seedEvents = [
    {
      id: "e1",
      title: "Saturday sandbar raft-up",
      placeId: "strawberry-island",
      vibe: "party",
      when: Date.now() + 2 * 24 * 3600000,
      rsvps: 28,
      mine: false,
      going: false,
    },
    {
      id: "e2",
      title: "Family float day",
      placeId: "metro-beach",
      vibe: "family",
      when: Date.now() + 3 * 24 * 3600000,
      rsvps: 14,
      mine: false,
      going: false,
    },
    {
      id: "e3",
      title: "Flats fishing meetup",
      placeId: "st-clair-flats",
      vibe: "fishing",
      when: Date.now() + 5 * 24 * 3600000,
      rsvps: 9,
      mine: false,
      going: false,
    },
  ];

  var seedMessages = [
    {
      id: "m1",
      name: "Maya",
      handle: "@maya_on_the_lake",
      preview: "See you at Strawberry around 2?",
      unread: 2,
      updatedAt: Date.now() - 8 * 60000,
    },
    {
      id: "m2",
      name: "Jordan",
      handle: "@jordan_flats",
      preview: "Walleye bite was solid near the flats channel",
      unread: 0,
      updatedAt: Date.now() - 45 * 60000,
    },
    {
      id: "m3",
      name: "Sam",
      handle: "@sam_family_float",
      preview: "Bringing the kids — calm water spot?",
      unread: 1,
      updatedAt: Date.now() - 2 * 3600000,
    },
  ];

  var seedDiscoverPeople = {
    suggested: [
      { name: "Alex", handle: "@alex_raft", note: "3 mutual connections · Party vibe" },
      { name: "Riley", handle: "@riley_dock", note: "Also on Lake St. Clair · Fishing" },
      { name: "Casey", handle: "@casey_crew", note: "Suggested for your crew interests" },
    ],
    lake: [
      { name: "Morgan", handle: "@morgan_bay", note: "Checked in at Anchor Bay today" },
      { name: "Taylor", handle: "@taylor_mile", note: "Nautical Mile regular · Chill" },
    ],
    new: [
      { name: "Jamie", handle: "@jamie_new", note: "New to RaftOff · Family boating" },
      { name: "Quinn", handle: "@quinn_lake", note: "Just joined · Watersports" },
    ],
  };

  /* utils */
  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function vibeById(id) {
    return (
      VIBES.find(function (v) {
        return v.id === id;
      }) || VIBES[1]
    );
  }

  function placeById(id) {
    return (
      ALL_PLACES.find(function (p) {
        return p.id === id;
      }) || PLACES[0]
    );
  }

  function isDiningPlace(p) {
    return !!p && !!p.partnerTier;
  }

  function pinColorForPlace(p) {
    if (isDiningPlace(p)) {
      return p.partnerTier === "featured" ? "#f5c542" : TYPE_COLORS[p.type] || "#e8c36a";
    }
    return TYPE_COLORS[p.type] || "#FF3D82";
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .map(function (p) {
        return p[0] || "";
      })
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function profileForAuthor(name) {
    var known = DEMO_PROFILES[name];
    if (known) return known;
    return {
      username: name.toLowerCase().replace(/\s+/g, "_") + "_lake",
      boat: null,
      interests: ["Boating", "Lake St. Clair"],
    };
  }

  function uniqueAuthorsFromCheckins(list) {
    var seen = {};
    var authors = [];
    (list || []).forEach(function (c) {
      if (!seen[c.author]) {
        seen[c.author] = true;
        authors.push(c.author);
      }
    });
    return authors;
  }

  function renderSheetPeople(nearby) {
    var el = $("sheet-people");
    if (!el) return;
    var authors = uniqueAuthorsFromCheckins(nearby);
    if (!authors.length) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    var maxShow = 6;
    var shown = authors.slice(0, maxShow);
    var overflow = authors.length - shown.length;
    el.hidden = false;
    el.innerHTML =
      '<span class="sheet-people-label">Here now · ' +
      authors.length +
      (authors.length === 1 ? " boater" : " boaters") +
      "</span>" +
      '<div class="sheet-people-row" role="list">' +
      shown
        .map(function (name) {
          return (
            '<button type="button" class="avatar-btn" data-author="' +
            escapeHtml(name) +
            '" role="listitem" aria-label="' +
            escapeHtml(name) +
            ' profile">' +
            escapeHtml(initials(name)) +
            "</button>"
          );
        })
        .join("") +
      (overflow > 0
        ? '<span class="avatar-overflow" aria-hidden="true">+' + overflow + "</span>"
        : "") +
      "</div>";
    el.onclick = function (event) {
      var btn = event.target.closest("[data-author]");
      if (!btn) return;
      event.stopPropagation();
      openMiniProfile(btn.getAttribute("data-author"));
    };
  }

  function closeMiniProfile() {
    var panel = $("mini-profile");
    if (panel) panel.hidden = true;
    document.querySelectorAll(".avatar-btn.is-active-ring").forEach(function (btn) {
      btn.classList.remove("is-active-ring");
    });
  }

  function openMiniProfile(author) {
    if (!author) return;
    var profile = profileForAuthor(author);
    var panel = $("mini-profile");
    if (!panel) return;
    $("mini-profile-avatar").textContent = initials(author);
    $("mini-profile-name").textContent = author;
    $("mini-profile-handle").textContent = "@" + profile.username + " · Lake St. Clair";
    var boatEl = $("mini-profile-boat");
    if (profile.boat) {
      boatEl.hidden = false;
      boatEl.textContent = "🚤 " + profile.boat;
    } else {
      boatEl.hidden = true;
      boatEl.textContent = "";
    }
    var interestsEl = $("mini-profile-interests");
    interestsEl.innerHTML = (profile.interests || [])
      .map(function (tag) {
        return "<span>" + escapeHtml(tag) + "</span>";
      })
      .join("");
    panel.hidden = false;
    document.querySelectorAll(".avatar-btn.is-active-ring").forEach(function (btn) {
      btn.classList.remove("is-active-ring");
    });
    var activeBtn = document.querySelector('.avatar-btn[data-author="' + author + '"]');
    if (activeBtn) activeBtn.classList.add("is-active-ring");
  }

  function formatTime(ts) {
    var m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + "m";
    var h = Math.floor(m / 60);
    if (h < 24) return h + "h";
    return Math.floor(h / 24) + "d";
  }

  function formatWhen(ts) {
    return new Date(ts).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function toast(message) {
    var el = $("toast");
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 2600);
  }

  function activeCheckins(list) {
    var now = Date.now();
    return (list || []).filter(function (c) {
      return c.endsAt > now && c.precision !== "hidden";
    });
  }

  /* state */
  var checkins = load(CHECKIN_KEY, null);
  if (!checkins || !checkins.length) checkins = seedCheckins.slice();

  var feedPosts = load(FEED_KEY, null);
  if (!feedPosts || !feedPosts.length) {
    feedPosts = seedCheckins
      .filter(function (c) {
        return c.toFeed;
      })
      .map(checkinToPost);
  }

  var events = load(EVENT_KEY, null);
  if (!events || !events.length) events = seedEvents.slice();

  var activeMine = load(ACTIVE_KEY, null);
  var mapVibeFilter = "all";
  var feedVibeFilter = "all";
  var eventFilter = "weekend";
  var selectedAnchorVibe = "chill";

  function checkinToPost(c) {
    return {
      id: "post-" + c.id,
      author: c.author,
      placeId: c.placeId,
      vibe: c.vibe,
      body: c.message || "Dropped anchor nearby.",
      createdAt: c.createdAt,
      likes: Math.floor(Math.random() * 8) + 1,
      comments: Math.floor(Math.random() * 4),
      liked: false,
      active: c.endsAt > Date.now(),
    };
  }

  /* tabs */
  function showTab(name) {
    document.querySelectorAll("[data-tab]").forEach(function (tab) {
      tab.classList.toggle("is-active", tab.getAttribute("data-tab") === name);
    });
    document.querySelectorAll("[data-panel]").forEach(function (panel) {
      panel.classList.toggle("is-active", panel.getAttribute("data-panel") === name);
    });
    if (history.replaceState) history.replaceState(null, "", "#" + name);
    if (name === "map" && window.__raftoffMap) {
      requestAnimationFrame(function () {
        window.__raftoffMap.resize();
      });
    }
  }

  document.querySelectorAll("[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      showTab(tab.getAttribute("data-tab"));
    });
  });

  var startHash = (location.hash || "#map").slice(1);
  if (["map", "feed", "messages", "discover", "anchor", "events", "profile"].indexOf(startHash) === -1) {
    startHash = "map";
  }
  showTab(startHash);

  /* shared selects / filters */
  function fillPlaceSelects() {
    ["anchor-place", "event-place"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      var hotspotOpts = PLACES.map(function (p) {
        return (
          '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + "</option>"
        );
      }).join("");
      var diningOpts = DINING.map(function (p) {
        var tag = p.partnerTier === "featured" ? " ★ Featured" : " · Partner";
        return (
          '<option value="' +
          escapeHtml(p.id) +
          '">' +
          escapeHtml(p.name) +
          tag +
          "</option>"
        );
      }).join("");
      el.innerHTML =
        '<optgroup label="Hotspots">' +
        hotspotOpts +
        '</optgroup><optgroup label="Bars & restaurants">' +
        diningOpts +
        "</optgroup>";
    });
  }

  function renderPartnerStrip() {
    var el = $("partner-strip");
    if (!el) return;
    var sorted = DINING.slice().sort(function (a, b) {
      if (a.partnerTier === b.partnerTier) return a.name.localeCompare(b.name);
      return a.partnerTier === "featured" ? -1 : 1;
    });
    el.innerHTML =
      '<div class="partner-strip-head">' +
      "<strong>Bars & restaurants on RaftOff</strong>" +
      "<span>" +
      DINING.filter(function (d) {
        return d.partnerTier === "featured";
      }).length +
      " featured · " +
      DINING.length +
      " partners</span></div>" +
      '<div class="partner-strip-row" role="list">' +
      sorted
        .map(function (d) {
          return (
            '<button type="button" class="partner-card partner-' +
            escapeHtml(d.partnerTier) +
            '" data-partner="' +
            escapeHtml(d.id) +
            '" role="listitem">' +
            '<span class="partner-tier">' +
            (d.partnerTier === "featured" ? "Featured partner" : "On RaftOff") +
            "</span>" +
            '<span class="partner-cat">' +
            escapeHtml(d.category) +
            "</span>" +
            "<strong>" +
            escapeHtml(d.name) +
            "</strong>" +
            "<small>" +
            escapeHtml(d.note) +
            "</small>" +
            "</button>"
          );
        })
        .join("") +
      "</div>";
    el.onclick = function (event) {
      var btn = event.target.closest("[data-partner]");
      if (!btn) return;
      openSheetForPlace(btn.getAttribute("data-partner"));
      if (liveMap && mapReady) {
        var p = placeById(btn.getAttribute("data-partner"));
        liveMap.flyTo({ center: [p.lng, p.lat], zoom: 12.5, essential: true });
      }
    };
  }

  function renderVibeChips(containerId, active, onPick, includeAll) {
    var el = $(containerId);
    if (!el) return;
    var items = includeAll
      ? [{ id: "all", label: "All vibes", color: "#2eb7e0" }].concat(VIBES)
      : VIBES;
    el.innerHTML = items
      .map(function (v) {
        return (
          '<button type="button" class="chip' +
          (active === v.id ? " is-active" : "") +
          '" data-vibe="' +
          v.id +
          '"><span class="vibe-dot" style="background:' +
          v.color +
          '"></span>' +
          escapeHtml(v.label) +
          "</button>"
        );
      })
      .join("");
    el.onclick = function (event) {
      var btn = event.target.closest("[data-vibe]");
      if (!btn) return;
      onPick(btn.getAttribute("data-vibe"));
    };
  }

  function renderAnchorVibes() {
    var el = $("anchor-vibes");
    if (!el) return;
    el.innerHTML = VIBES.map(function (v) {
      return (
        '<button type="button" class="vibe-option' +
        (selectedAnchorVibe === v.id ? " is-active" : "") +
        '" data-pick-vibe="' +
        v.id +
        '"><span class="vibe-dot" style="background:' +
        v.color +
        '"></span> ' +
        escapeHtml(v.label) +
        "</button>"
      );
    }).join("");
    el.onclick = function (event) {
      var btn = event.target.closest("[data-pick-vibe]");
      if (!btn) return;
      selectedAnchorVibe = btn.getAttribute("data-pick-vibe");
      renderAnchorVibes();
    };
  }

  fillPlaceSelects();
  renderPartnerStrip();
  renderAnchorVibes();

  var layerFilters = $("layer-filters");
  if (layerFilters) {
    layerFilters.onclick = function (event) {
      var btn = event.target.closest("[data-layer]");
      if (!btn) return;
      mapLayerFilter = btn.getAttribute("data-layer");
      layerFilters.querySelectorAll("[data-layer]").forEach(function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-layer") === mapLayerFilter);
      });
      renderPlaces();
    };
  }

  var eventVibe = $("event-vibe");
  if (eventVibe) {
    eventVibe.innerHTML = VIBES.map(function (v) {
      return '<option value="' + v.id + '">' + escapeHtml(v.label) + "</option>";
    }).join("");
  }

  /* map — real Esri aerial of Lake St. Clair + verified lat/lng pins */
  var liveMap = null;
  var placeMarkers = [];
  var checkinMarkers = [];
  var mapReady = false;

  function clearMarkers(list) {
    list.forEach(function (m) {
      m.remove();
    });
    list.length = 0;
  }

  function makePinEl(opts) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "map-pin" + (opts.active ? " is-active" : "");
    btn.title = opts.label;
    btn.setAttribute("aria-label", opts.label);
    if (opts.placeId) btn.dataset.place = opts.placeId;
    if (opts.checkinId) btn.dataset.checkin = opts.checkinId;
    var color = opts.color || "#FF3D82";
    btn.innerHTML =
      '<svg width="28" height="36" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M15 1.5C8.1 1.5 2.5 7.1 2.5 14c0 8.8 12.5 22.5 12.5 22.5S27.5 22.8 27.5 14C27.5 7.1 21.9 1.5 15 1.5z" fill="' +
      color +
      '" stroke="#fff" stroke-width="2.2"/>' +
      '<circle cx="15" cy="14" r="5" fill="rgba(0,0,0,.25)"/>' +
      '<circle cx="15" cy="14" r="3.2" fill="#fff"/></svg>';
    return btn;
  }

  function updateMapSummary() {
    var active = activeCheckins(checkins);
    var activeEl = $("summary-active");
    var hotEl = $("summary-hot");
    var updatedEl = $("summary-updated");
    if (activeEl) activeEl.textContent = active.length + " check-ins";
    var hotspot = {};
    active.forEach(function (c) {
      hotspot[c.placeId] = (hotspot[c.placeId] || 0) + 1;
    });
    var top = Object.keys(hotspot).sort(function (a, b) {
      return hotspot[b] - hotspot[a];
    })[0];
    if (hotEl) hotEl.textContent = top ? placeById(top).name : "—";
    if (updatedEl) updatedEl.textContent = "just now";
  }

  function renderPlaces() {
    if (!liveMap || !mapReady || !window.maplibregl) return;
    clearMarkers(placeMarkers);
    var list = ALL_PLACES.filter(function (p) {
      if (mapLayerFilter === "dining") return isDiningPlace(p);
      if (mapLayerFilter === "hotspots") return !isDiningPlace(p);
      return true;
    });
    list.forEach(function (p) {
      var el = makePinEl({
        label: p.name,
        placeId: p.id,
        color: pinColorForPlace(p),
        active: isDiningPlace(p) && p.partnerTier === "featured",
      });
      if (isDiningPlace(p)) el.classList.add("map-pin-dining");
      if (p.partnerTier === "featured") el.classList.add("map-pin-featured");
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        openSheetForPlace(p.id);
      });
      var marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([p.lng, p.lat])
        .addTo(liveMap);
      placeMarkers.push(marker);
    });
  }

  function renderCheckinPins() {
    updateMapSummary();
    if (!liveMap || !mapReady || !window.maplibregl) return;
    clearMarkers(checkinMarkers);
    var list = activeCheckins(checkins).filter(function (c) {
      return mapVibeFilter === "all" || c.vibe === mapVibeFilter;
    });

    list.forEach(function (c) {
      var place = placeById(c.placeId);
      var vibe = vibeById(c.vibe);
      var jitter = ((c.id.charCodeAt(c.id.length - 1) || 1) % 7) - 3;
      var lng = place.lng + jitter * 0.004;
      var lat = place.lat + jitter * 0.003;
      var el = makePinEl({
        label: c.author + " · " + vibe.label,
        checkinId: c.id,
        color: vibe.color,
        active: true,
      });
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        openSheetForCheckin(c.id);
      });
      var marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lng, lat])
        .addTo(liveMap);
      checkinMarkers.push(marker);
    });
  }

  function openSheetForCheckin(id) {
    var c = checkins.find(function (item) {
      return item.id === id;
    });
    if (!c) return;
    var place = placeById(c.placeId);
    var vibe = vibeById(c.vibe);
    var sheet = $("map-sheet");
    $("sheet-vibe").innerHTML =
      '<span class="vibe-dot" style="background:' +
      vibe.color +
      '"></span>' +
      escapeHtml(vibe.label) +
      " · active";
    $("sheet-title").textContent = place.name;
    $("sheet-meta").textContent =
      c.author + " · " + formatTime(c.createdAt) + " · " + c.precision + " precision";
    $("sheet-body").textContent = c.message || "Checked in nearby.";
    renderSheetPeople(
      activeCheckins(checkins).filter(function (item) {
        return item.placeId === c.placeId;
      })
    );
    closeMiniProfile();
    sheet.hidden = false;
    sheet.dataset.placeId = c.placeId;
  }

  function openSheetForPlace(id) {
    var place = placeById(id);
    var nearby = activeCheckins(checkins).filter(function (c) {
      return c.placeId === id;
    });
    var sheet = $("map-sheet");
    if (isDiningPlace(place)) {
      $("sheet-vibe").innerHTML =
        '<span class="partner-badge partner-' +
        escapeHtml(place.partnerTier) +
        '">' +
        (place.partnerTier === "featured" ? "Featured partner" : "On RaftOff") +
        "</span> · " +
        escapeHtml(place.category);
      $("sheet-title").textContent = place.name;
      $("sheet-meta").textContent = place.note + " · Lake St. Clair";
      $("sheet-body").textContent =
        place.pitch ||
        "Partner listing on RaftOff — ask about Featured ads & sponsored placement.";
      renderSheetPeople(nearby);
    } else {
      $("sheet-vibe").textContent = nearby.length
        ? nearby.length + " active nearby"
        : "Place";
      $("sheet-title").textContent = place.name;
      $("sheet-meta").textContent = place.type + " · Lake St. Clair";
      $("sheet-body").textContent = nearby.length
        ? "Live activity here. Drop Anchor to join the map."
        : "Quiet right now — be the first to Drop Anchor.";
      renderSheetPeople(nearby);
    }
    closeMiniProfile();
    sheet.hidden = false;
    sheet.dataset.placeId = place.id;
  }

  function initLiveMap() {
    var container = $("live-map");
    var maplib = window.maplibregl;
    if (!container) return;
    if (!maplib || typeof maplib.Map !== "function") {
      container.innerHTML =
        '<p class="map-fallback">Loading Lake St. Clair map…</p>';
      return;
    }

    try {
      liveMap = new maplib.Map({
        container: container,
        style: {
          version: 8,
          sources: {
            esri: {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
              attribution:
                "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics",
              maxzoom: 19,
            },
          },
          layers: [{ id: "esri", type: "raster", source: "esri" }],
        },
        center: LAKE_FRAME.center,
        zoom: 10.2,
        attributionControl: true,
        maxBounds: [
          [LAKE_FRAME.sw[0] - 0.15, LAKE_FRAME.sw[1] - 0.12],
          [LAKE_FRAME.ne[0] + 0.15, LAKE_FRAME.ne[1] + 0.12],
        ],
      });
      window.__raftoffMap = liveMap;

      liveMap.fitBounds([LAKE_FRAME.sw, LAKE_FRAME.ne], {
        padding: 28,
        duration: 0,
        maxZoom: 11.2,
      });

      liveMap.on("load", function () {
        mapReady = true;
        renderPlaces();
        renderCheckinPins();
        liveMap.resize();
      });

      liveMap.on("click", function () {
        var sheet = $("map-sheet");
        if (sheet) sheet.hidden = true;
        closeMiniProfile();
      });

      window.addEventListener("resize", function () {
        if (liveMap) liveMap.resize();
      });
    } catch (err) {
      console.error("Lake St. Clair map failed", err);
      container.innerHTML =
        '<p class="map-fallback">Could not load aerial map. Check your connection.</p>';
    }
  }

  // Defer until layout has real dimensions (MapLibre needs non-zero container)
  updateMapSummary();
  if (document.readyState === "complete") {
    requestAnimationFrame(function () {
      initLiveMap();
    });
  } else {
    window.addEventListener("load", function () {
      requestAnimationFrame(function () {
        initLiveMap();
      });
    });
  }

  function setMapFilter(id) {
    mapVibeFilter = id;
    renderVibeChips("vibe-filters", mapVibeFilter, setMapFilter, true);
    renderCheckinPins();
  }
  renderVibeChips("vibe-filters", mapVibeFilter, setMapFilter, true);

  $("sheet-close").addEventListener("click", function () {
    $("map-sheet").hidden = true;
    closeMiniProfile();
  });

  $("mini-profile-close").addEventListener("click", function () {
    closeMiniProfile();
  });

  $("mini-profile-link").addEventListener("click", function () {
    var name = $("mini-profile-name").textContent;
    closeMiniProfile();
    $("map-sheet").hidden = true;
    toast("Full profile for " + name + " (coming in app)");
  });

  $("fab-anchor").addEventListener("click", function () {
    showTab("anchor");
  });

  $("sheet-anchor").addEventListener("click", function () {
    var placeId = $("map-sheet").dataset.placeId;
    if (placeId) $("anchor-place").value = placeId;
    $("map-sheet").hidden = true;
    showTab("anchor");
  });

  $("sheet-feed").addEventListener("click", function () {
    $("map-sheet").hidden = true;
    showTab("feed");
  });

  /* feed */
  function renderFeed() {
    var list = $("feed-list");
    var items = feedPosts
      .filter(function (p) {
        return feedVibeFilter === "all" || p.vibe === feedVibeFilter;
      })
      .sort(function (a, b) {
        return b.createdAt - a.createdAt;
      });

    if (!items.length) {
      list.innerHTML =
        '<li class="feed-item" style="display:block;color:var(--muted)">No posts for this vibe yet.</li>';
      return;
    }

    list.innerHTML = items
      .map(function (p) {
        var place = placeById(p.placeId);
        var vibe = vibeById(p.vibe);
        return (
          '<li class="feed-item" data-post="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="avatar">' +
          escapeHtml(initials(p.author)) +
          "</div><div>" +
          '<div class="feed-meta"><span class="feed-author">' +
          escapeHtml(p.author) +
          '</span><span class="feed-time">' +
          escapeHtml(formatTime(p.createdAt)) +
          '</span><span class="feed-place">' +
          escapeHtml(place.name) +
          " · " +
          escapeHtml(vibe.label) +
          (p.active ? " · live" : "") +
          "</span></div>" +
          '<p class="feed-body">' +
          escapeHtml(p.body) +
          "</p>" +
          '<div class="feed-actions">' +
          '<button type="button" class="react-btn' +
          (p.liked ? " is-active" : "") +
          '" data-like>Like · ' +
          p.likes +
          "</button>" +
          '<button type="button" class="react-btn" data-comment>Comment · ' +
          p.comments +
          "</button>" +
          "</div></div></li>"
        );
      })
      .join("");
  }

  function setFeedFilter(id) {
    feedVibeFilter = id;
    renderVibeChips("feed-filters", feedVibeFilter, setFeedFilter, true);
    renderFeed();
  }
  renderVibeChips("feed-filters", feedVibeFilter, setFeedFilter, true);
  renderFeed();

  /* messages */
  function renderMessages() {
    var list = $("message-list");
    if (!list) return;
    if (!seedMessages.length) {
      list.innerHTML =
        '<li class="feed-item" style="display:block;color:var(--muted)">No conversations yet.</li>';
      return;
    }
    list.innerHTML = seedMessages
      .slice()
      .sort(function (a, b) {
        return b.updatedAt - a.updatedAt;
      })
      .map(function (m) {
        return (
          '<li class="feed-item message-item" data-thread="' +
          escapeHtml(m.id) +
          '">' +
          '<div class="avatar">' +
          escapeHtml(initials(m.name)) +
          "</div><div>" +
          '<div class="feed-meta"><span class="feed-author">' +
          escapeHtml(m.name) +
          '</span><span class="feed-time">' +
          escapeHtml(formatTime(m.updatedAt)) +
          (m.unread
            ? ' <span class="msg-unread">' + m.unread + " new</span>"
            : "") +
          "</span></div>" +
          '<p class="feed-body">' +
          escapeHtml(m.preview) +
          "</p>" +
          '<p class="feed-place">' +
          escapeHtml(m.handle) +
          "</p></div></li>"
        );
      })
      .join("");
  }

  $("message-list") &&
    $("message-list").addEventListener("click", function (event) {
      var item = event.target.closest("[data-thread]");
      if (!item) return;
      var thread = seedMessages.find(function (m) {
        return m.id === item.getAttribute("data-thread");
      });
      if (!thread) return;
      thread.unread = 0;
      renderMessages();
      toast("Open thread with " + thread.name + " (full chat in Expo app)");
    });

  $("btn-connections") &&
    $("btn-connections").addEventListener("click", function () {
      toast("Connections & requests (Expo app)");
    });

  renderMessages();

  /* discover */
  var discoverFilter = "suggested";

  function renderDiscover() {
    var list = $("discover-list");
    if (!list) return;
    var people = seedDiscoverPeople[discoverFilter] || [];
    if (!people.length) {
      list.innerHTML =
        '<li class="feed-item" style="display:block;color:var(--muted)">No people in this view yet.</li>';
      return;
    }
    list.innerHTML = people
      .map(function (p) {
        return (
          '<li class="feed-item discover-item">' +
          '<div class="avatar">' +
          escapeHtml(initials(p.name)) +
          "</div><div>" +
          '<div class="feed-meta"><span class="feed-author">' +
          escapeHtml(p.name) +
          '</span><span class="feed-place">' +
          escapeHtml(p.handle) +
          "</span></div>" +
          '<p class="feed-body">' +
          escapeHtml(p.note) +
          "</p>" +
          '<div class="feed-actions">' +
          '<button type="button" class="react-btn" data-connect>Connect</button>' +
          '<button type="button" class="react-btn" data-message>Message</button>' +
          "</div></div></li>"
        );
      })
      .join("");
  }

  document.querySelectorAll("[data-discover]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      discoverFilter = chip.getAttribute("data-discover");
      document.querySelectorAll("[data-discover]").forEach(function (c) {
        c.classList.toggle("is-active", c === chip);
      });
      renderDiscover();
    });
  });

  $("discover-list") &&
    $("discover-list").addEventListener("click", function (event) {
      if (event.target.closest("[data-connect]")) {
        toast("Connection request sent (Expo app)");
        return;
      }
      if (event.target.closest("[data-message]")) {
        showTab("messages");
        toast("Start a DM from Messages (Expo app)");
      }
    });

  renderDiscover();

  $("feed-list").addEventListener("click", function (event) {
    var like = event.target.closest("[data-like]");
    if (!like) return;
    var item = event.target.closest("[data-post]");
    var post = feedPosts.find(function (p) {
      return p.id === item.getAttribute("data-post");
    });
    if (!post) return;
    if (post.liked) {
      post.liked = false;
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.liked = true;
      post.likes += 1;
    }
    save(FEED_KEY, feedPosts);
    renderFeed();
  });

  /* drop anchor */
  $("anchor-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var duration = parseInt($("anchor-duration").value, 10) || 120;
    var checkin = {
      id: "c-" + Date.now(),
      author: "You",
      placeId: $("anchor-place").value,
      vibe: selectedAnchorVibe,
      message: $("anchor-message").value.trim(),
      audience: $("anchor-audience").value,
      precision: $("anchor-precision").value,
      createdAt: Date.now(),
      endsAt: Date.now() + duration * 60000,
      toFeed: $("anchor-to-feed").checked,
    };

    checkins.unshift(checkin);
    save(CHECKIN_KEY, checkins);
    activeMine = checkin;
    save(ACTIVE_KEY, activeMine);

    if (checkin.toFeed && checkin.precision !== "hidden") {
      feedPosts.unshift(checkinToPost(checkin));
      save(FEED_KEY, feedPosts);
      renderFeed();
    }

    renderCheckinPins();
    renderProfile();
    $("anchor-message").value = "";
    toast("Anchor dropped · visible per your privacy settings");
    showTab("map");
  });

  /* events */
  function renderEvents() {
    var list = $("event-list");
    var now = Date.now();
    var weekendEnd = now + 3 * 24 * 3600000;
    var items = events.filter(function (e) {
      if (eventFilter === "mine") return e.mine || e.going;
      if (eventFilter === "weekend") return e.when >= now && e.when <= weekendEnd;
      return e.when >= now;
    });

    if (!items.length) {
      list.innerHTML =
        '<li class="event-card"><p>No events in this view yet.</p></li>';
      return;
    }

    list.innerHTML = items
      .map(function (e) {
        var place = placeById(e.placeId);
        var vibe = vibeById(e.vibe);
        return (
          '<li class="event-card" data-event="' +
          escapeHtml(e.id) +
          '">' +
          "<h3>" +
          escapeHtml(e.title) +
          "</h3>" +
          "<p>" +
          escapeHtml(formatWhen(e.when)) +
          " · " +
          escapeHtml(place.name) +
          " · " +
          escapeHtml(vibe.label) +
          " · " +
          e.rsvps +
          " going</p>" +
          '<button type="button" class="btn ' +
          (e.going ? "btn-ghost" : "btn-primary") +
          ' btn-sm" data-rsvp>' +
          (e.going ? "Going ✓" : "RSVP Going") +
          "</button></li>"
        );
      })
      .join("");
  }

  document.querySelectorAll("[data-event-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      eventFilter = btn.getAttribute("data-event-filter");
      document.querySelectorAll("[data-event-filter]").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      renderEvents();
    });
  });

  $("event-list").addEventListener("click", function (event) {
    var btn = event.target.closest("[data-rsvp]");
    if (!btn) return;
    var card = event.target.closest("[data-event]");
    var ev = events.find(function (e) {
      return e.id === card.getAttribute("data-event");
    });
    if (!ev) return;
    ev.going = !ev.going;
    ev.rsvps += ev.going ? 1 : -1;
    save(EVENT_KEY, events);
    renderEvents();
    toast(ev.going ? "You’re going" : "RSVP removed");
  });

  $("btn-new-event").addEventListener("click", function () {
    $("event-create").hidden = false;
  });
  $("event-cancel").addEventListener("click", function () {
    $("event-create").hidden = true;
  });

  $("event-create").addEventListener("submit", function (event) {
    event.preventDefault();
    var whenVal = $("event-when").value;
    var created = {
      id: "e-" + Date.now(),
      title: $("event-title").value.trim(),
      placeId: $("event-place").value,
      vibe: $("event-vibe").value,
      when: whenVal ? new Date(whenVal).getTime() : Date.now() + 86400000,
      rsvps: 1,
      mine: true,
      going: true,
    };
    events.unshift(created);
    save(EVENT_KEY, events);
    $("event-create").reset();
    $("event-create").hidden = true;
    eventFilter = "mine";
    document.querySelectorAll("[data-event-filter]").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-event-filter") === "mine");
    });
    renderEvents();
    toast("Event published");
  });

  renderEvents();

  /* profile */
  function renderProfile() {
    var banner = $("active-banner");
    var now = Date.now();
    if (activeMine && activeMine.endsAt > now) {
      banner.hidden = false;
      $("active-banner-text").textContent =
        placeById(activeMine.placeId).name +
        " · " +
        vibeById(activeMine.vibe).label +
        " · ends " +
        formatTime(activeMine.endsAt).replace(/^/, "in ~") +
        " remaining window";
      // fix awkward text
      var minsLeft = Math.max(1, Math.round((activeMine.endsAt - now) / 60000));
      $("active-banner-text").textContent =
        placeById(activeMine.placeId).name +
        " · " +
        vibeById(activeMine.vibe).label +
        " · ~" +
        minsLeft +
        "m left";
    } else {
      banner.hidden = true;
      if (activeMine) {
        activeMine = null;
        save(ACTIVE_KEY, null);
      }
    }

    var mine = checkins.filter(function (c) {
      return c.author === "You";
    });
    var hist = $("checkin-history");
    if (!mine.length) {
      hist.innerHTML = "<li><span>No check-ins yet</span><strong>—</strong></li>";
      return;
    }
    hist.innerHTML = mine
      .slice(0, 8)
      .map(function (c) {
        return (
          "<li><span>" +
          escapeHtml(placeById(c.placeId).name) +
          " · " +
          escapeHtml(vibeById(c.vibe).label) +
          "</span><strong>" +
          (c.endsAt > Date.now() ? "Active" : formatTime(c.createdAt)) +
          "</strong></li>"
        );
      })
      .join("");
  }

  $("end-checkin").addEventListener("click", function () {
    if (!activeMine) return;
    activeMine.endsAt = Date.now() - 1000;
    checkins = checkins.map(function (c) {
      return c.id === activeMine.id ? activeMine : c;
    });
    save(CHECKIN_KEY, checkins);
    activeMine = null;
    save(ACTIVE_KEY, null);
    renderCheckinPins();
    renderProfile();
    toast("Check-in ended");
  });

  renderProfile();

  /* header stubs */
  $("btn-search").addEventListener("click", function () {
    toast("Search: lakes, places, users, events (coming next)");
  });
  $("btn-alerts").addEventListener("click", function () {
    toast("Notifications: friend check-ins & event updates");
  });

  // expire pins periodically
  setInterval(function () {
    renderCheckinPins();
    renderProfile();
  }, 30000);
})();
