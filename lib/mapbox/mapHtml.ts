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
 * Bird's-eye lake map.
 * - With Mapbox token: satellite-streets style
 * - Without token: Esri World Imagery (real aerial photos of the lakes)
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
}): string {
  const { token, center, zoom, markers, bounds, lakeName } = options;
  const markersJson = JSON.stringify(markers);
  const hasToken = Boolean(token);
  // Slightly tighter than street zoom so water fills the frame
  const aerialZoom = Math.min(zoom + 0.35, 13.5);

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
  html, body, #map { margin:0; height:100%; width:100%; background:#0a1520; }
  .maplibregl-ctrl-attrib, .mapboxgl-ctrl-attrib {
    font-size:9px; opacity:.75; background:rgba(0,0,0,.45) !important; color:#fff !important;
  }
  .maplibregl-ctrl-attrib a, .mapboxgl-ctrl-attrib a { color:#cfe8ff !important; }
  .pin {
    width: 30px; height: 38px; border:0; padding:0; background:transparent; cursor:pointer;
    filter: drop-shadow(0 8px 14px rgba(0,0,0,.55));
  }
  .pin svg { display:block; }
  .pin.active { transform: scale(1.2); }
  .hud {
    position:absolute; left:12px; top:12px; z-index:5;
    color:#F4FBFF; font:600 12px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;
    background:rgba(5,12,18,.62); backdrop-filter: blur(12px);
    border:1px solid rgba(255,255,255,.18); border-radius:14px; padding:10px 12px;
    pointer-events:none; max-width:72%;
    box-shadow: 0 10px 30px rgba(0,0,0,.28);
  }
  .hud strong { display:block; font-size:15px; letter-spacing:-0.02em; }
  .hud span { opacity:.8; font-weight:500; }
  .vignette {
    pointer-events:none; position:absolute; inset:0; z-index:2;
    background: radial-gradient(ellipse at center, transparent 45%, rgba(5,10,15,.35) 100%);
  }
</style>
</head>
<body>
<div id="map"></div>
<div class="vignette"></div>
<div class="hud"><strong>${lakeName.replace(/</g, "")}</strong><span>Bird’s-eye view · tap a pin</span></div>
<script>
  const markers = ${markersJson};
  const bounds = [[${bounds.sw.longitude}, ${bounds.sw.latitude}], [${bounds.ne.longitude}, ${bounds.ne.latitude}]];
  const center = [${center.longitude}, ${center.latitude}];
  const zoom = ${aerialZoom};
  const hasToken = ${hasToken ? "true" : "false"};

  function post(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }

  function pinEl(m) {
    const btn = document.createElement('button');
    btn.className = 'pin' + (m.active ? ' active' : '');
    btn.setAttribute('aria-label', m.label);
    const ring = m.active ? '#ffffff' : 'rgba(255,255,255,0.92)';
    btn.innerHTML = '<svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">'
      + '<path d="M15 1.5C8.1 1.5 2.5 7.1 2.5 14c0 8.8 12.5 22.5 12.5 22.5S27.5 22.8 27.5 14C27.5 7.1 21.9 1.5 15 1.5z" fill="'+m.color+'" stroke="'+ring+'" stroke-width="2.2"/>'
      + '<circle cx="15" cy="14" r="5.2" fill="rgba(0,0,0,.22)"/>'
      + '<circle cx="15" cy="14" r="3.4" fill="#fff"/></svg>';
    btn.onclick = (e) => { e.stopPropagation(); post({ type:'select', id:m.id }); };
    return btn;
  }

  // Esri World Imagery = real aerial photographs of lakes (bird's-eye)
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
    bearing: 0
  });

  map.fitBounds(bounds, { padding: 36, duration: 0, maxZoom: Math.max(zoom, 11.5) });

  const markerObjs = [];
  function renderMarkers() {
    markerObjs.forEach(m => m.remove());
    markerObjs.length = 0;
    markers.forEach(m => {
      const marker = new maplib.Marker({ element: pinEl(m), anchor: 'bottom' })
        .setLngLat([m.lng, m.lat])
        .addTo(map);
      markerObjs.push(marker);
    });
  }
  map.on('load', renderMarkers);
  map.on('click', () => post({ type: 'mapclick' }));
</script>
</body>
</html>`;
}
