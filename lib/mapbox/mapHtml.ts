/**
 * Approximate Lake St. Clair shoreline ring (lng, lat).
 * Public geography for visual framing — not for navigation.
 */
export const LAKE_ST_CLAIR_SHORELINE: [number, number][] = [
  [-82.92, 42.335], // Detroit River entrance
  [-82.905, 42.36],
  [-82.895, 42.39], // Grosse Pointe
  [-82.885, 42.43],
  [-82.88, 42.48], // St. Clair Shores
  [-82.87, 42.52],
  [-82.84, 42.56],
  [-82.81, 42.58], // Metro Beach
  [-82.79, 42.61],
  [-82.78, 42.64], // Anchor Bay west
  [-82.74, 42.68],
  [-82.7, 42.695], // Anchor Bay north
  [-82.64, 42.69],
  [-82.58, 42.675],
  [-82.52, 42.65], // Ontario / Thames approach
  [-82.47, 42.62],
  [-82.45, 42.58],
  [-82.46, 42.54],
  [-82.5, 42.5],
  [-82.55, 42.46],
  [-82.6, 42.42],
  [-82.68, 42.39],
  [-82.78, 42.36],
  [-82.88, 42.34],
  [-82.92, 42.335],
];

const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

export const isMapboxConfigured =
  Boolean(token) && token.startsWith("pk.") && !token.includes("your_mapbox");

export function getMapboxToken(): string | null {
  return isMapboxConfigured ? token : null;
}

/** Bird's-eye aerial when Mapbox token is present */
export const MAP_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  active: boolean;
  label: string;
  kind: "social" | "service" | "event" | "fishing" | "dining" | "other";
  subtitle?: string;
};

/**
 * Bird's-eye lake map — real aerial imagery of Lake St. Clair (and other lakes).
 * - With Mapbox token: satellite-streets style
 * - Without token: Esri World Imagery (real aerial photos)
 */
export function buildMapHtml(options: {
  token: string | null;
  center: { latitude: number; longitude: number };
  zoom: number;
  lakeName: string;
  markers: MapMarker[];
  bounds: {
    ne: { latitude: number; longitude: number };
    sw: { latitude: number; longitude: number };
  };
  /** @deprecated Aerial imagery already shows the real shoreline */
  emphasizeShoreline?: boolean;
}): string {
  const { token, center, zoom, markers, bounds, lakeName } = options;
  const markersJson = JSON.stringify(markers);
  const hasToken = Boolean(token);
  const aerialZoom = Math.min(zoom + 0.55, 11.8);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
${
  hasToken
    ? `<link href="https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.css" rel="stylesheet" />
<script src="https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.js"></script>`
    : `<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>`
}
<style>
  html, body, #map { margin:0; height:100%; width:100%; background:#071018; }
  .maplibregl-ctrl-attrib, .mapboxgl-ctrl-attrib {
    font-size:9px; opacity:.75; background:rgba(0,0,0,.45) !important; color:#fff !important;
  }
  .maplibregl-ctrl-attrib a, .mapboxgl-ctrl-attrib a { color:#cfe8ff !important; }
  .pin {
    width: 30px; height: 38px; border:0; padding:0; background:transparent; cursor:pointer;
    filter: drop-shadow(0 8px 14px rgba(0,0,0,.55));
  }
  .pin svg { display:block; }
  .pin.active { transform: scale(1.18); }
  .hud {
    position:absolute; left:12px; top:12px; z-index:5;
    color:#F4FBFF; font:600 12px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;
    background:rgba(5,12,18,.7); backdrop-filter: blur(12px);
    border:1px solid rgba(255,255,255,.18); border-radius:14px; padding:10px 12px;
    pointer-events:none; max-width:72%;
    box-shadow: 0 10px 30px rgba(0,0,0,.28);
  }
  .hud strong { display:block; font-size:15px; letter-spacing:-0.02em; }
  .hud span { opacity:.82; font-weight:500; }
</style>
</head>
<body>
<div id="map"></div>
<div class="hud"><strong>${lakeName.replace(/</g, "")}</strong><span>Real aerial · tap a hotspot</span></div>
<script>
  const markers = ${markersJson};
  const bounds = [[${bounds.sw.longitude}, ${bounds.sw.latitude}], [${bounds.ne.longitude}, ${bounds.ne.latitude}]];
  const center = [${center.longitude}, ${center.latitude}];
  const zoom = ${aerialZoom};
  const hasToken = ${hasToken ? "true" : "false"};

  function post(msg) {
    const payload = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(payload);
    else if (window.parent && window.parent !== window) window.parent.postMessage(payload, '*');
  }

  function pinEl(m) {
    const btn = document.createElement('button');
    btn.className = 'pin' + (m.active ? ' active' : '');
    btn.title = m.label + (m.subtitle ? ' — ' + m.subtitle : '');
    btn.setAttribute('aria-label', m.label);
    const ring = m.active ? '#ffffff' : 'rgba(255,255,255,0.92)';
    btn.innerHTML = '<svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">'
      + '<path d="M15 1.5C8.1 1.5 2.5 7.1 2.5 14c0 8.8 12.5 22.5 12.5 22.5S27.5 22.8 27.5 14C27.5 7.1 21.9 1.5 15 1.5z" fill="'+m.color+'" stroke="'+ring+'" stroke-width="2.2"/>'
      + '<circle cx="15" cy="14" r="5.2" fill="rgba(0,0,0,.22)"/>'
      + '<circle cx="15" cy="14" r="3.4" fill="#fff"/></svg>';
    btn.onclick = (e) => { e.stopPropagation(); post({ type:'select', id:m.id }); };
    return btn;
  }

  const aerialStyle = {
    version: 8,
    sources: {
      esri: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
        maxzoom: 19
      }
    },
    layers: [{ id: 'esri', type: 'raster', source: 'esri' }]
  };

  const style = hasToken ? ${JSON.stringify(MAP_STYLE)} : aerialStyle;

  if (hasToken) {
    mapboxgl.accessToken = ${JSON.stringify(token)};
  }
  const maplib = hasToken ? mapboxgl : maplibregl;
  const map = new maplib.Map({
    container: 'map',
    style,
    center,
    zoom,
    attributionControl: true,
    pitch: 0,
    bearing: 0,
    maxBounds: [
      [${bounds.sw.longitude - 0.15}, ${bounds.sw.latitude - 0.12}],
      [${bounds.ne.longitude + 0.15}, ${bounds.ne.latitude + 0.12}]
    ]
  });

  map.fitBounds(bounds, { padding: 28, duration: 0, maxZoom: 11.2 });

  const markerObjs = [];

  function clearMarkers() {
    markerObjs.forEach(m => m.remove());
    markerObjs.length = 0;
  }

  function clusterPoints(points, zoomLevel) {
    const expandAt = 11.5;
    if (zoomLevel >= expandAt || points.length <= 12) {
      return points.map(p => ({ type: 'point', ...p }));
    }
    const cell = Math.max(0.02, 0.35 / Math.pow(2, Math.max(zoomLevel - 8, 0)));
    const buckets = new Map();
    points.forEach(p => {
      const key = Math.floor(p.lat / cell) + '_' + Math.floor(p.lng / cell);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(p);
    });
    const out = [];
    buckets.forEach((list, key) => {
      if (list.length === 1) out.push({ type: 'point', ...list[0] });
      else {
        const lat = list.reduce((s, p) => s + p.lat, 0) / list.length;
        const lng = list.reduce((s, p) => s + p.lng, 0) / list.length;
        out.push({ type: 'cluster', id: 'c-' + key, lat, lng, count: list.length, color: '#FF3D82', label: list.length + ' spots', active: true });
      }
    });
    return out;
  }

  function clusterEl(c) {
    const btn = document.createElement('button');
    btn.className = 'pin active';
    btn.title = c.count + ' hotspots';
    btn.setAttribute('aria-label', c.count + ' hotspots');
    btn.innerHTML = '<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">'
      + '<circle cx="18" cy="18" r="16" fill="#FF3D82" stroke="#fff" stroke-width="2"/>'
      + '<text x="18" y="22" text-anchor="middle" fill="#fff" font-size="12" font-family="sans-serif" font-weight="700">' + c.count + '</text></svg>';
    btn.onclick = (e) => {
      e.stopPropagation();
      map.easeTo({ center: [c.lng, c.lat], zoom: Math.min(map.getZoom() + 1.5, 13) });
    };
    return btn;
  }

  function renderMarkers() {
    clearMarkers();
    const z = map.getZoom();
    clusterPoints(markers, z).forEach(item => {
      if (item.type === 'cluster') {
        markerObjs.push(new maplib.Marker({ element: clusterEl(item), anchor: 'center' }).setLngLat([item.lng, item.lat]).addTo(map));
      } else {
        markerObjs.push(new maplib.Marker({ element: pinEl(item), anchor: 'bottom' }).setLngLat([item.lng, item.lat]).addTo(map));
      }
    });
  }

  map.on('load', () => {
    renderMarkers();
  });

  let zoomTimer = null;
  map.on('zoomend', () => {
    clearTimeout(zoomTimer);
    zoomTimer = setTimeout(renderMarkers, 120);
  });

  map.on('click', () => post({ type: 'mapclick' }));
</script>
</body>
</html>`;
}
