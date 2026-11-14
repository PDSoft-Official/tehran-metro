(() => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  let registration;
  function offerUpdate(worker) {
          const button = document.createElement('button');
          button.textContent = 'نسخهٔ جدید آماده است؛ باز کردن';
          button.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;background:#102a43;color:white;border:1px solid #75cfff;border-radius:12px;padding:14px;font:inherit;max-width:90vw;cursor:pointer';
          button.onclick = () => { worker.postMessage('ACTIVATE_UPDATE'); };
          document.body.append(button);
  }
  const check = () => registration && registration.update().catch(() => {});
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(r => {
    registration = r;
    if (r.waiting) offerUpdate(r.waiting);
    check();
    r.addEventListener('updatefound', () => {
      const worker = r.installing;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          offerUpdate(worker);
        }
      });
    });
  }).catch(() => {});
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloading && navigator.serviceWorker.controller) { reloading = true; location.reload(); }
  });
  addEventListener('online', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
})();
