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
(() => {
  const pane = document.getElementById('pane-settings');
  if (!pane) return;
  let pending = null, installed = false;
  const mode = matchMedia('(display-mode: standalone)');
  const row = document.createElement('div');
  row.id = 'pwa-install-section';
  const button = document.createElement('button');
  button.type = 'button'; button.id = 'pwa-install-button';
  button.className = 'sync-pill-btn';
  button.style.cssText = 'width:100%;min-height:44px;justify-content:center;font:inherit';
  const help = document.createElement('p');
  help.id = 'pwa-install-help'; help.hidden = true;
  help.setAttribute('role', 'status');
  help.style.cssText = 'font:inherit;font-size:13px;line-height:1.9;margin:8px 0;white-space:normal';
  button.setAttribute('aria-describedby', help.id);
  row.append(button, help); pane.prepend(row);
  function refresh() {
    row.hidden = installed || mode.matches || navigator.standalone === true;
    button.textContent = pending ? 'نصب برنامه' : 'نصب برنامه / راهنما';
  }
  function guide() {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    help.textContent = ios
      ? 'در Safari، منوی اشتراک‌گذاری را باز کنید و «افزودن به صفحهٔ اصلی» را بزنید.'
      : 'از منوی مرورگر، «نصب برنامه» یا «افزودن به صفحهٔ اصلی» را انتخاب کنید. اگر این گزینه نیست، لینک را در Chrome یا Edge باز کنید؛ امکان نصب به مرورگر و دستگاه بستگی دارد.';
    help.hidden = false;
  }
  addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); pending = event; help.hidden = true; refresh();
  });
  addEventListener('appinstalled', () => { installed = true; pending = null; refresh(); });
  mode.addEventListener('change', refresh);
  button.onclick = async () => {
    if (!pending) { guide(); return; }
    const event = pending; pending = null; button.disabled = true;
    try { await event.prompt(); await event.userChoice; }
    catch (_) { guide(); }
    finally { button.disabled = false; refresh(); }
  };
  refresh();
})();
