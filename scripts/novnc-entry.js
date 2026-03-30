// Entry point for the bundled noVNC page
// esbuild bundles this + @novnc/novnc/lib/rfb.js into one ESM file
import RFB from '@novnc/novnc/lib/rfb.js';

const status = document.getElementById('status');

// Parameters passed via URL hash: #wss=...&pass=...
const params = {};
location.hash.slice(1).split('&').forEach(p => {
  const [k, v] = p.split('=');
  if (k) params[k] = decodeURIComponent(v || '');
});

const wssUrl = params.wss;
const password = params.pass;

if (!wssUrl) {
  status.textContent = 'Error: no console URL provided';
} else {
  const rfb = new RFB(document.getElementById('screen'), wssUrl, {
    credentials: { password },
  });

  rfb.scaleViewport = true;
  rfb.resizeSession = false;

  rfb.addEventListener('connect', () => {
    status.textContent = 'Connected';
    setTimeout(() => { status.style.display = 'none'; }, 2000);
  });
  rfb.addEventListener('disconnect', e => {
    status.style.display = 'block';
    status.textContent = e.detail.clean ? 'Disconnected' : 'Connection lost';
  });
  rfb.addEventListener('credentialsrequired', () => {
    rfb.sendCredentials({ password });
  });
}
