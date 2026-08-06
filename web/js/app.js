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
  };

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
      PLACES.find(function (p) {
        return p.id === id;
      }) || PLACES[0]
    );
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
  if (["map", "feed", "anchor", "events", "profile"].indexOf(startHash) === -1) {
    startHash = "map";
  }
  showTab(startHash);

  /* shared selects / filters */
  function fillPlaceSelects() {
    ["anchor-place", "event-place"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.innerHTML = PLACES.map(function (p) {
        return (
          '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + "</option>"
        );
      }).join("");
    });
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
  renderAnchorVibes();

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
    PLACES.forEach(function (p) {
      var el = makePinEl({
        label: p.name,
        placeId: p.id,
        color: TYPE_COLORS[p.type] || "#FF3D82",
        active: false,
      });
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
    sheet.hidden = false;
    sheet.dataset.placeId = c.placeId;
  }

  function openSheetForPlace(id) {
    var place = placeById(id);
    var nearby = activeCheckins(checkins).filter(function (c) {
      return c.placeId === id;
    });
    var sheet = $("map-sheet");
    $("sheet-vibe").textContent = nearby.length
      ? nearby.length + " active nearby"
      : "Place";
    $("sheet-title").textContent = place.name;
    $("sheet-meta").textContent = place.type + " · Lake St. Clair";
    $("sheet-body").textContent = nearby.length
      ? "Live activity here. Drop Anchor to join the map."
      : "Quiet right now — be the first to Drop Anchor.";
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
