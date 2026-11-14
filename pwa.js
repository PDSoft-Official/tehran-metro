(() => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  const BUILD = 'tehran-metro-1.5-pwa-8', KEY = 'metro-pending-update';
  let registration, reloading = false, offered, timer;
  function bubble(text, action) {
    let box = document.getElementById('metro-update-notice');
    if (!box) { box = document.createElement('button'); box.id='metro-update-notice'; box.type='button'; box.setAttribute('aria-live','polite'); box.style.cssText='position:fixed;bottom:calc(96px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:99999;background:#102a43;color:#fff;border:2px solid #80e4ff;border-radius:22px;padding:16px 22px;font:inherit;font-weight:800;font-size:15px;line-height:1.8;max-width:calc(100vw - 32px);width:370px;box-shadow:0 10px 32px #0005;cursor:pointer;text-align:center;white-space:pre-line';document.body.append(box); }
    box.textContent=text;box.disabled=false;box.onclick=action||(()=>box.remove());return box;
  }
  function version(worker) {
    return new Promise((resolve,reject)=>{
      if(!worker) return reject(Error('no worker'));
      const channel=new MessageChannel(), timeout=setTimeout(()=>{channel.port1.close();reject(Error('timeout'));},4000);
      channel.port1.onmessage=e=>{clearTimeout(timeout);channel.port1.close();resolve(e.data);};
      worker.postMessage({type:'GET_VERSION'},[channel.port2]);
    });
  }
  function readMarker(){try{return JSON.parse(sessionStorage.getItem(KEY));}catch(_){return null;}}
  function clearMarker(){try{sessionStorage.removeItem(KEY);}catch(_){}}
  async function verifyApplied(){
    const marker=readMarker();if(!marker)return;
    try {
      const controller=navigator.serviceWorker.controller, info=await version(controller);
      if(controller===navigator.serviceWorker.controller && info.ready && info.version===BUILD && marker.target===BUILD && marker.from!==BUILD){
        clearMarker();bubble('✓ نسخهٔ جدید با موفقیت اعمال شد\nبرای بستن این پیام لمس کنید');
      }else {clearMarker();bubble('اعمال نسخهٔ جدید تأیید نشد\nبرنامه را دوباره باز کنید');}
    }catch(_){clearMarker();bubble('تأیید به‌روزرسانی ممکن نشد\nبرنامه را دوباره باز کنید');}
  }
  function offerUpdate(worker){
    if(offered===worker)return;offered=worker;
    const retry=()=>{offered=null;offerUpdate(registration.waiting||worker);};
    bubble('نسخهٔ جدید آماده است ✨\nبرای اعمال به‌روزرسانی اینجا لمس کنید',async()=>{
      const box=bubble('در حال اعمال به‌روزرسانی…');box.disabled=true;
      try{
        const info=await version(worker);
        if(!info.ready||!info.version||info.version===BUILD)throw Error('invalid update');
        sessionStorage.setItem(KEY,JSON.stringify({from:BUILD,target:info.version}));
        worker.postMessage('ACTIVATE_UPDATE');
        timer=setTimeout(()=>{clearMarker();bubble('به‌روزرسانی انجام نشد\nبرای تلاش دوباره لمس کنید',retry);},12000);
      }catch(_){clearMarker();bubble('به‌روزرسانی انجام نشد\nبرای تلاش دوباره لمس کنید',retry);}
    });
  }
  const check=()=>registration&&registration.update().catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timer);if(!reloading&&navigator.serviceWorker.controller){reloading=true;location.reload();}});
  navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>{
    registration=r;verifyApplied();if(r.waiting)offerUpdate(r.waiting);check();
    r.addEventListener('updatefound',()=>{const worker=r.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)offerUpdate(worker);});});
  }).catch(()=>{if(readMarker()){clearMarker();bubble('تأیید به‌روزرسانی ممکن نشد\nبرنامه را دوباره باز کنید');}});
  addEventListener('online',check);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
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
