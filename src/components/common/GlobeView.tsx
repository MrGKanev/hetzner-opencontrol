import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export interface GlobeMarker {
  latitude: number;
  longitude: number;
  label: string;
  active: boolean;
}

interface Props {
  markers?: GlobeMarker[];
  height?: number;
}

// Simplified continent outlines as [lon, lat] pairs (same as old WorldMap)
const CONTINENTS = [
  // North America
  [[-168,72],[-152,72],[-135,70],[-115,75],[-95,74],[-80,67],[-64,63],[-55,58],[-66,48],[-68,44],[-75,35],[-65,30],[-58,20],[-60,15],[-60,7],[-75,8],[-85,10],[-95,25],[-117,32],[-124,46],[-126,50],[-137,58]],
  // South America
  [[-82,8],[-78,0],[-60,-5],[-50,-15],[-44,-23],[-52,-33],[-62,-38],[-68,-45],[-70,-50],[-65,-55],[-58,-50],[-63,-42],[-67,-35],[-65,-25],[-70,-15],[-75,-5],[-77,2]],
  // Europe
  [[-10,36],[0,36],[5,43],[10,44],[15,44],[18,40],[22,38],[28,36],[34,37],[36,41],[40,42],[44,43],[40,48],[35,48],[32,52],[28,56],[24,60],[20,62],[15,58],[10,55],[5,52],[0,51],[-5,48],[-8,44],[-10,36]],
  // Africa
  [[-17,14],[-15,10],[-15,5],[-5,5],[0,5],[5,4],[10,4],[15,4],[20,3],[25,3],[30,5],[34,8],[42,12],[44,12],[44,0],[40,-10],[35,-18],[32,-25],[28,-32],[18,-35],[15,-30],[12,-20],[10,-5],[8,5],[5,5],[2,10],[0,14],[-5,12],[-10,10],[-17,14]],
  // Asia (simplified)
  [[34,37],[36,41],[40,42],[44,43],[48,40],[55,38],[60,35],[65,35],[70,35],[75,32],[80,28],[85,22],[90,22],[95,20],[100,12],[105,10],[110,5],[118,-8],[125,-15],[135,-22],[140,-30],[145,-38],[150,-38],[155,-28],[160,-22],[168,-8],[175,0],[180,10],[175,20],[170,35],[175,60],[170,65],[165,68],[160,68],[155,60],[145,55],[140,50],[135,45],[130,40],[125,35],[120,30],[115,25],[110,18],[105,15],[100,10],[95,8],[90,12],[85,20],[80,28],[75,35],[70,40],[65,45],[60,50],[55,55],[50,60],[45,55],[40,50],[36,46],[32,52],[28,56],[24,60],[20,62],[15,58],[10,55],[5,52],[0,51],[-5,48],[-8,44],[-10,36],[0,36],[5,43],[10,44],[15,44],[18,40],[22,38],[28,36],[34,37]],
  // Australia
  [[114,-22],[116,-20],[120,-18],[125,-14],[130,-12],[136,-12],[138,-14],[140,-18],[142,-22],[145,-25],[148,-30],[152,-30],[154,-28],[152,-24],[150,-22],[153,-26],[152,-30],[148,-38],[144,-38],[140,-36],[136,-35],[130,-32],[124,-34],[118,-34],[114,-30],[112,-25],[114,-22]],
  // Greenland
  [[-48,84],[-30,82],[-18,78],[-22,74],[-30,72],[-44,70],[-52,68],[-58,68],[-62,72],[-68,76],[-65,80],[-52,84],[-48,84]],
];

function buildHtml(markers: GlobeMarker[]): string {
  const markersJson = JSON.stringify(
    markers.map(m => ({ lat: m.latitude, lng: m.longitude, active: m.active, label: m.label }))
  );
  const continentsJson = JSON.stringify(CONTINENTS);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%;background:#0d0d0d;overflow:hidden}
  canvas{display:block;width:100%;height:100%}
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
(function(){
const MARKERS = ${markersJson};
const CONTINENTS = ${continentsJson};
const HAS_ACTIVE = MARKERS.some(m=>m.active);

const canvas = document.getElementById('c');
const W = window.innerWidth, H = window.innerHeight;
canvas.width = W * devicePixelRatio;
canvas.height = H * devicePixelRatio;
canvas.style.width = W + 'px';
canvas.style.height = H + 'px';
const ctx = canvas.getContext('2d');
ctx.scale(devicePixelRatio, devicePixelRatio);

const R = Math.min(W, H) * 0.42;
const cx = W / 2, cy = H / 2;

// Rotation state
let rotY = HAS_ACTIVE ? -avgLng() * Math.PI / 180 : 0;
let rotX = HAS_ACTIVE ?  avgLat() * Math.PI / 180 * 0.4 : 0.3;
let vY = 0, vX = 0;
let dragging = false, px = 0, py = 0;
const AUTO = 0.003;

function avgLng(){
  const a=MARKERS.filter(m=>m.active);
  return a.length ? a.reduce((s,m)=>s+m.lng,0)/a.length : 0;
}
function avgLat(){
  const a=MARKERS.filter(m=>m.active);
  return a.length ? a.reduce((s,m)=>s+m.lat,0)/a.length : 0;
}

// Convert lon/lat + current rotation to 3D then project
function project(lon, lat) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = lon * Math.PI / 180;
  // Sphere coords
  let x = Math.sin(phi) * Math.cos(theta);
  let y = Math.cos(phi);
  let z = Math.sin(phi) * Math.sin(theta);
  // Rotate around Y
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const nx = x * cosY - z * sinY;
  const nz = x * sinY + z * cosY;
  x = nx; z = nz;
  // Rotate around X
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const ny = y * cosX - z * sinX;
  const nz2 = y * sinX + z * cosX;
  y = ny; z = nz2;
  return { sx: cx + x * R, sy: cy - y * R, z };
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Globe background with radial gradient
  const grad = ctx.createRadialGradient(cx - R*0.25, cy - R*0.2, R*0.05, cx, cy, R);
  grad.addColorStop(0, '#1e2030');
  grad.addColorStop(0.7, '#0f1018');
  grad.addColorStop(1, '#06070d');
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Atmosphere glow
  const atm = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.08);
  atm.addColorStop(0, 'rgba(226,0,26,0.12)');
  atm.addColorStop(1, 'rgba(226,0,26,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
  ctx.fillStyle = atm;
  ctx.fill();

  // Draw continent outlines
  ctx.strokeStyle = '#2e3048';
  ctx.lineWidth = 0.8;
  ctx.fillStyle = '#1a1c2e';

  for (const shape of CONTINENTS) {
    let started = false;
    let allBack = true;
    // Check if any point is front-facing
    for (const [lon, lat] of shape) {
      const p = project(lon, lat);
      if (p.z > -0.1) { allBack = false; break; }
    }
    if (allBack) continue;

    ctx.beginPath();
    for (const [lon, lat] of shape) {
      const { sx, sy, z } = project(lon, lat);
      if (!started) { ctx.moveTo(sx, sy); started = true; }
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Clip to globe circle for markers
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  // Draw markers
  for (const m of MARKERS) {
    const { sx, sy, z } = project(m.lng, m.lat);
    if (z < 0) continue; // behind globe

    if (m.active) {
      // Outer glow
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12);
      glow.addColorStop(0, 'rgba(226,0,26,0.5)');
      glow.addColorStop(1, 'rgba(226,0,26,0)');
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#e2001a';
      ctx.fill();
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#444455';
      ctx.fill();
    }
  }

  ctx.restore();

  // Specular highlight
  const spec = ctx.createRadialGradient(cx - R*0.35, cy - R*0.35, 0, cx - R*0.2, cy - R*0.2, R*0.7);
  spec.addColorStop(0, 'rgba(255,255,255,0.06)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = spec;
  ctx.fill();

  // Edge shadow (dark rim)
  const rim = ctx.createRadialGradient(cx, cy, R * 0.75, cx, cy, R);
  rim.addColorStop(0, 'rgba(0,0,0,0)');
  rim.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = rim;
  ctx.fill();
}

// Touch handlers
canvas.addEventListener('touchstart', e => {
  dragging = true;
  px = e.touches[0].clientX;
  py = e.touches[0].clientY;
  vY = 0; vX = 0;
}, {passive:true});

canvas.addEventListener('touchmove', e => {
  if (!dragging) return;
  const dx = e.touches[0].clientX - px;
  const dy = e.touches[0].clientY - py;
  px = e.touches[0].clientX;
  py = e.touches[0].clientY;
  vY = dx * 0.005;
  vX = dy * 0.005;
  rotY += vY;
  rotX = Math.max(-1.3, Math.min(1.3, rotX + vX));
  draw();
}, {passive:true});

canvas.addEventListener('touchend', () => { dragging = false; }, {passive:true});

// Animation loop
let last = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  if (ts - last < 16) return; // ~60fps cap
  last = ts;
  if (!dragging) {
    rotY += AUTO;
    if (Math.abs(vY) > 0.0002 || Math.abs(vX) > 0.0002) {
      rotY += vY; rotX = Math.max(-1.3, Math.min(1.3, rotX + vX));
      vY *= 0.92; vX *= 0.92;
    }
  }
  draw();
}
requestAnimationFrame(loop);
})();
</script>
</body>
</html>`;
}

export default function GlobeView({ markers = [], height = 260 }: Props) {
  const html = buildHtml(markers);

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        originWhitelist={['*']}
        androidLayerType="hardware"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0d0d0d',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
