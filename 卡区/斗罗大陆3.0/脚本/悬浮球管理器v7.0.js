(async function () {
  'use strict';

  var STORE = 'fbm_cap_v4';
  var detected = [];
  var capturedSet = new Set();
  var tempReleased = new Map();
  var visualCache = new Map();
  var triggerEl = null;
  var trayEl = null;
  var trayOpen = false;

  function topDoc() { try { return window.top?.document || document; } catch { return document; } }
  function topWin() { try { return window.top || window; } catch { return window; } }

  function loadCap() { try { capturedSet = new Set(JSON.parse(localStorage.getItem(STORE) || '[]')); } catch { capturedSet = new Set(); } }
  function saveCap() { try { localStorage.setItem(STORE, JSON.stringify([...capturedSet])); } catch {} }

  function fprint(el) {
    if (el.id) return 'i:' + el.id;
    var s = (el.innerHTML || '').slice(0, 120), v = 0;
    for (var i = 0; i < s.length; i++) v = ((v << 5) - v + s.charCodeAt(i)) | 0;
    return 'h:' + v;
  }

  /* ===== 检测 ===== */
  function isFloatBall(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el === triggerEl || el === trayEl) return false;
    if (el.id === 'fbm-trigger' || el.id === 'fbm-tray') return false;
    try { if (el.closest('#fbm-trigger') || el.closest('#fbm-tray')) return false; } catch {}
    if (el._fbmHidden) return true;

    var s;
    try { s = topWin().getComputedStyle(el); } catch { return false; }
    if (s.position !== 'fixed' || s.display === 'none') return false;
    var r = el.getBoundingClientRect();
    if (r.width < 16 || r.width > 100 || r.height < 16 || r.height > 100) return false;
    if (Math.abs(r.width - r.height) > 20) return false;
    var zi = parseInt(s.zIndex);
    if (isNaN(zi) || zi < 1000) return false;
    var br = parseFloat(s.borderRadius);
    if (s.borderRadius !== '50%' && (isNaN(br) || br < Math.min(r.width, r.height) * 0.25)) return false;
    return true;
  }

  /* ===== 隐藏/恢复 ===== */
  var HIDE_PROPS = [
    ['visibility','hidden'],['pointer-events','none'],['opacity','0'],
    ['width','0'],['height','0'],['padding','0'],['margin','0'],
    ['overflow','hidden'],['max-width','0'],['max-height','0'],
    ['min-width','0'],['min-height','0'],['border','0']
  ];

  function doHide(el) {
    if (el._fbmHidden) return;
    if (!el._fbmOldStyle) el._fbmOldStyle = el.style.cssText;
    el._fbmHidden = true;
    HIDE_PROPS.forEach(function(p) { el.style.setProperty(p[0], p[1], 'important'); });
  }

  function doShow(el) {
    if (!el._fbmHidden) return;
    el.style.cssText = el._fbmOldStyle || '';
    el._fbmHidden = false;
  }

  function forceHide(el) {
    HIDE_PROPS.forEach(function(p) { el.style.setProperty(p[0], p[1], 'important'); });
  }

  /* ===== 外观提取（缓存，只做一次）===== */
  function getVisual(el) {
    var id = fprint(el);
    if (visualCache.has(id)) return visualCache.get(id);

    var info = {
      bg: 'rgba(60,60,60,0.9)', border: '1.5px solid rgba(255,255,255,0.15)',
      shadow: '0 2px 8px rgba(0,0,0,0.3)', color: '#fff', svg: '', radius: '50%'
    };

    var wasHidden = el._fbmHidden;
    if (wasHidden) el.style.cssText = el._fbmOldStyle || '';

    try {
      var cs = topWin().getComputedStyle(el);
      info.bg = cs.background || cs.backgroundColor || info.bg;
      info.border = cs.border || info.border;
      info.shadow = cs.boxShadow || info.shadow;
      info.color = cs.color || info.color;
      info.radius = cs.borderRadius || '50%';
      var svg = el.querySelector('svg');
      if (svg) {
        var sc = svg.cloneNode(true);
        sc.removeAttribute('width'); sc.removeAttribute('height');
        sc.style.width = '20px'; sc.style.height = '20px';
        info.svg = sc.outerHTML;
      } else {
        var t = (el.textContent || '').trim();
        info.svg = t.length > 0 && t.length <= 4
          ? '<span style="font-size:14px">' + t + '</span>'
          : '<span style="font-size:14px">●</span>';
      }
    } catch {}

    if (wasHidden) {
      el._fbmHidden = false;
      doHide(el);
    }

    visualCache.set(id, info);
    return info;
  }

  /* ===== 扫描 ===== */
  function collectBalls() {
    var doc = topDoc();
    if (!doc || !doc.body) return [];
    var seen = new Set();
    var result = [];

    function check(el) {
      if (seen.has(el)) return;
      seen.add(el);
      if (!isFloatBall(el)) return;
      var id = fprint(el);
      var isCap = capturedSet.has(id);
      var visual = getVisual(el);
      result.push({ el: el, id: id, visual: visual, captured: isCap });
      if (isCap && !tempReleased.has(id) && !el._fbmHidden) doHide(el);
    }

    var ch = doc.body.children;
    for (var i = 0; i < ch.length; i++) {
      check(ch[i]);
      if (ch[i].children) {
        for (var j = 0; j < ch[i].children.length; j++) check(ch[i].children[j]);
      }
    }
    return result;
  }

  function scan() {
    detected = collectBalls();
    updateBadge();
  }

  /* ===== 初始隐藏 ===== */
  function applyCaptures() {
    var doc = topDoc();
    if (!doc || !doc.body) return;
    function tryH(el) {
      if (el === triggerEl || el === trayEl) return;
      try { if (el.closest('#fbm-trigger') || el.closest('#fbm-tray')) return; } catch {}
      if (isFloatBall(el) && capturedSet.has(fprint(el))) {
        if (!el._fbmOldStyle) el._fbmOldStyle = el.style.cssText;
        el._fbmHidden = false;
        doHide(el);
      }
    }
    var ch = doc.body.children;
    for (var i = 0; i < ch.length; i++) {
      tryH(ch[i]);
      if (ch[i].children) { for (var j = 0; j < ch[i].children.length; j++) tryH(ch[i].children[j]); }
    }
  }

  /* 防原脚本覆盖样式：每3秒强制确认 */
  function startReinforce() {
    setInterval(function() {
      if (capturedSet.size === 0) return;
      var doc = topDoc();
      if (!doc || !doc.body) return;

      function enforce(el) {
        if (el === triggerEl || el === trayEl) return;
        try { if (el.closest('#fbm-trigger') || el.closest('#fbm-tray')) return; } catch {}
        if (!el._fbmHidden) return;
        var id = fprint(el);
        if (!capturedSet.has(id) || tempReleased.has(id)) return;
        if (el.style.visibility !== 'hidden' || el.style.opacity !== '0') forceHide(el);
      }

      var ch = doc.body.children;
      for (var i = 0; i < ch.length; i++) {
        enforce(ch[i]);
        if (ch[i].children) { for (var j = 0; j < ch[i].children.length; j++) enforce(ch[i].children[j]); }
      }
    }, 3000);
  }

  function updateBadge() {
    if (!triggerEl) return;
    var badge = triggerEl.querySelector('#fbm-badge');
    if (!badge) return;
    badge.style.display = capturedSet.size > 0 ? 'flex' : 'none';
    badge.textContent = String(capturedSet.size);
  }

  /* ===== 模拟点击 ===== */
  function fireClick(el) {
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2, w = topWin();
    try {
      el.dispatchEvent(new PointerEvent('pointerdown', { clientX:cx, clientY:cy, bubbles:true, button:0, pointerId:1, pointerType:'touch', isPrimary:true, view:w }));
      el.dispatchEvent(new PointerEvent('pointerup', { clientX:cx, clientY:cy, bubbles:true, button:0, pointerId:1, pointerType:'touch', isPrimary:true, view:w }));
    } catch {}
    try { el.click(); } catch {}
  }

  /* ===== 收揽 ===== */
  function capture(b) {
    capturedSet.add(b.id);
    b.captured = true;
    doHide(b.el);
    saveCap();
    updateBadge();
  }

  /* ===== 临时释放 + 打开面板 + 自动收回 ===== */
  function releaseAndOpen(b) {
    var id = b.id;
    doShow(b.el);
    tempReleased.set(id, { el: b.el, cleanup: null });

    /* 等原球渲染+原脚本重新绑定事件 */
    setTimeout(function() {
      fireClick(b.el);

      setTimeout(function() {
        var done = false;

        var recapture = function() {
          if (done) return;
          done = true;
          b.el.removeEventListener('click', onC, true);
          b.el.removeEventListener('touchend', onT, true);
          clearTimeout(tId);
          tempReleased.delete(id);
          setTimeout(function() {
            if (!b.el._fbmHidden) doHide(b.el);
            updateBadge();
          }, 600);
        };

        var onC = function() { setTimeout(recapture, 100); };
        var onT = function() { setTimeout(recapture, 100); };

        b.el.addEventListener('click', onC, true);
        b.el.addEventListener('touchend', onT, true);

        var tId = setTimeout(recapture, 90000);

        tempReleased.set(id, {
          el: b.el,
          cleanup: function() {
            if (done) return;
            done = true;
            b.el.removeEventListener('click', onC, true);
            b.el.removeEventListener('touchend', onT, true);
            clearTimeout(tId);
          }
        });
      }, 1500);
    }, 200);
  }

  /* 手动收回 */
  function manualRecap(b) {
    if (tempReleased.has(b.id)) {
      var tr = tempReleased.get(b.id);
      if (tr.cleanup) tr.cleanup();
      tempReleased.delete(b.id);
    }
    if (!b.el._fbmHidden) doHide(b.el);
    updateBadge();
  }

  /* 完全释放 */
  function fullRelease(b) {
    if (tempReleased.has(b.id)) {
      var tr = tempReleased.get(b.id);
      if (tr.cleanup) tr.cleanup();
      tempReleased.delete(b.id);
    }
    capturedSet.delete(b.id);
    b.captured = false;
    doShow(b.el);
    saveCap();
    updateBadge();
  }

  /* ===== 拖拽 ===== */
  function setupDrag(el, handle, onClick) {
    var tActive = false, tMoved = false, sx, sy, ex, ey, elW, elH, rafId = null, tx, ty;

    function applyPos() { el.style.left = tx + 'px'; el.style.top = ty + 'px'; rafId = null; }

    handle.addEventListener('touchstart', function(e) {
      if (e.target !== handle && e.target.closest && e.target.closest('[data-clickable]')) return;
      var t = e.touches[0];
      sx = t.clientX; sy = t.clientY;
      var r = el.getBoundingClientRect();
      ex = r.left; ey = r.top; elW = r.width; elH = r.height;
      tMoved = false; tActive = true;
    }, { passive: true });

    handle.addEventListener('touchmove', function(e) {
      if (!tActive) return;
      var t = e.touches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (!tMoved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      tMoved = true;
      e.preventDefault();
      tx = Math.max(0, Math.min(ex + dx, topWin().innerWidth - elW));
      ty = Math.max(0, Math.min(ey + dy, topWin().innerHeight - elH));
      if (!rafId) rafId = requestAnimationFrame(applyPos);
    }, { passive: false });

    handle.addEventListener('touchend', function(e) {
      if (!tActive) return;
      tActive = false;
      if (rafId) { cancelAnimationFrame(rafId); applyPos(); }
      if (!tMoved) {
        e.preventDefault();
        if (onClick) onClick(e);
      }
    });

    handle.addEventListener('touchcancel', function() { tActive = false; });

    var mDown = false, mMoved = false, msx, msy, mex, mey;
    handle.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      if (e.target !== handle && e.target.closest && e.target.closest('[data-clickable]')) return;
      mDown = true; mMoved = false;
      msx = e.clientX; msy = e.clientY;
      var r = el.getBoundingClientRect();
      mex = r.left; mey = r.top; elW = r.width; elH = r.height;
      e.preventDefault();
    });
    topDoc().addEventListener('mousemove', function(e) {
      if (!mDown) return;
      var dx = e.clientX - msx, dy = e.clientY - msy;
      if (!mMoved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      mMoved = true;
      tx = Math.max(0, Math.min(mex + dx, topWin().innerWidth - elW));
      ty = Math.max(0, Math.min(mey + dy, topWin().innerHeight - elH));
      if (!rafId) rafId = requestAnimationFrame(applyPos);
    });
    topDoc().addEventListener('mouseup', function() {
      if (!mDown) return;
      mDown = false;
      if (rafId) { cancelAnimationFrame(rafId); applyPos(); }
      if (!mMoved && onClick) onClick();
    });
  }

  /* ===== 托盘 ===== */
  function buildTray() {
    var doc = topDoc();
    var old = doc.getElementById('fbm-tray');
    if (old) old.remove();
    var el = doc.createElement('div');
    el.id = 'fbm-tray';
    el.style.cssText = 'position:fixed;z-index:2147483646;display:none;flex-direction:column;align-items:center;gap:6px;padding:6px;border-radius:26px;background:rgba(28,28,30,0.88);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.1);box-shadow:0 6px 24px rgba(0,0,0,0.45);touch-action:none;user-select:none;opacity:0;transform:scale(0.8);transition:opacity 0.18s,transform 0.18s;max-height:70vh;overflow-y:auto;-webkit-overflow-scrolling:touch';
    doc.body.appendChild(el);
    trayEl = el;
    setupDrag(trayEl, trayEl);
  }

  function makeMini(visual, state) {
    var doc = topDoc();
    var b = doc.createElement('div');
    var op = state === 'free' ? '0.35' : '1';
    var bd = state === 'free' ? '2px dashed rgba(255,255,255,0.25)' : visual.border;
    b.style.cssText = 'width:40px;height:40px;border-radius:' + visual.radius + ';background:' + visual.bg + ';border:' + bd + ';box-shadow:' + visual.shadow + ';color:' + visual.color + ';display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;overflow:hidden;position:relative;opacity:' + op + ';transition:transform 0.1s,opacity 0.15s';
    b.innerHTML = visual.svg;
    b.setAttribute('data-clickable', '1');

    if (state !== 'free') {
      var dc = state === 'captured' ? '#30d158' : '#ff9f0a';
      var dot = doc.createElement('span');
      dot.style.cssText = 'position:absolute;top:1px;right:1px;width:8px;height:8px;border-radius:50%;background:' + dc + ';border:1px solid rgba(0,0,0,0.3);pointer-events:none';
      b.appendChild(dot);
    }
    return b;
  }

  function refreshTray() {
    if (!trayEl) buildTray();
    trayEl.innerHTML = '';

    if (detected.length === 0) {
      var e = topDoc().createElement('div');
      e.style.cssText = 'width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;color:#636366;font-size:11px';
      e.textContent = '空';
      trayEl.appendChild(e);
      return;
    }

    detected.forEach(function(b) {
      var isTemp = tempReleased.has(b.id);
      var state = b.captured ? (isTemp ? 'released' : 'captured') : 'free';
      var mini = makeMini(b.visual, state);

      /* 统一用一种事件模型：移动端touchend，桌面端click，互不干扰 */
      var tapped = false;

      mini.addEventListener('touchstart', function() {
        tapped = false;
        mini.style.transform = 'scale(0.85)';
      }, { passive: true });

      mini.addEventListener('touchmove', function() {
        tapped = true;
        mini.style.transform = '';
      }, { passive: true });

      mini.addEventListener('touchend', function(e) {
        mini.style.transform = '';
        if (tapped) return;
        e.preventDefault();
        e.stopPropagation();
        ballAction(b);
      });

      mini.addEventListener('click', function(e) {
        e.stopPropagation();
        ballAction(b);
      });

      trayEl.appendChild(mini);
    });
  }

  function ballAction(b) {
    var isTemp = tempReleased.has(b.id);

    if (isTemp) {
      manualRecap(b);
      refreshTray();
    } else if (b.captured) {
      closeTray();
      setTimeout(function() { releaseAndOpen(b); }, 200);
    } else {
      capture(b);
      refreshTray();
    }
  }

  /* ===== 关闭区域外监听 ===== */
  var outsideHandler = null;

  function addOutsideClose() {
    removeOutsideClose();
    outsideHandler = function(e) {
      if (trayEl && trayEl.contains(e.target)) return;
      if (triggerEl && triggerEl.contains(e.target)) return;
      closeTray();
    };
    setTimeout(function() {
      topDoc().addEventListener('touchstart', outsideHandler, { passive: true });
      topDoc().addEventListener('mousedown', outsideHandler);
    }, 150);
  }

  function removeOutsideClose() {
    if (!outsideHandler) return;
    topDoc().removeEventListener('touchstart', outsideHandler);
    topDoc().removeEventListener('mousedown', outsideHandler);
    outsideHandler = null;
  }

  function openTray() {
    scan();
    refreshTray();
    if (!trayEl || !triggerEl) return;

    var tr = triggerEl.getBoundingClientRect();
    var W = topWin().innerWidth, H = topWin().innerHeight;
    var tw = 54, th = Math.min(detected.length * 48 + 12, H * 0.7);
    var left = tr.right + 8 < W - tw ? tr.right + 8 : (tr.left - tw - 8 > 0 ? tr.left - tw - 8 : tr.left);
    var top = Math.max(8, Math.min(tr.top + tr.height / 2 - th / 2, H - th - 8));

    trayEl.style.left = left + 'px';
    trayEl.style.top = top + 'px';
    trayEl.style.display = 'flex';
    requestAnimationFrame(function() {
      trayEl.style.opacity = '1';
      trayEl.style.transform = 'scale(1)';
    });
    trayOpen = true;
    addOutsideClose();
  }

  function closeTray() {
    if (!trayEl) return;
    trayEl.style.opacity = '0';
    trayEl.style.transform = 'scale(0.8)';
    setTimeout(function() { if (trayEl) trayEl.style.display = 'none'; }, 200);
    trayOpen = false;
    removeOutsideClose();
  }

  /* ===== 主球 ===== */
  function createTrigger() {
    var doc = topDoc();
    var old = doc.getElementById('fbm-trigger');
    if (old) old.remove();
    var el = doc.createElement('div');
    el.id = 'fbm-trigger';
    el.style.cssText = 'position:fixed;top:120px;left:8px;width:44px;height:44px;border-radius:50%;background:rgba(10,132,255,0.92);box-shadow:0 2px 16px rgba(10,132,255,0.4);z-index:2147483647;cursor:pointer;display:flex;align-items:center;justify-content:center;user-select:none;touch-action:none;color:#fff;font-size:17px;border:2px solid rgba(255,255,255,0.25)';
    el.innerHTML = '⊞<span id="fbm-badge" style="position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;border-radius:8px;background:#ff453a;color:#fff;font-size:9px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 3px;line-height:1">0</span>';
    doc.body.appendChild(el);
    triggerEl = el;
    setupDrag(triggerEl, triggerEl, function() {
      if (trayOpen) closeTray();
      else openTray();
    });
  }

  /* ===== 清理 ===== */
  window.addEventListener('pagehide', function() {
    detected.forEach(function(b) { if (b.el._fbmHidden) doShow(b.el); });
    tempReleased.forEach(function(tr) { if (tr.cleanup) tr.cleanup(); });
    tempReleased.clear();
    removeOutsideClose();
    var doc = topDoc();
    var t = doc.getElementById('fbm-trigger');
    var p = doc.getElementById('fbm-tray');
    if (t) t.remove();
    if (p) p.remove();
    triggerEl = null; trayEl = null;
  });

  /* ===== 启动 ===== */
  loadCap();

  replaceScriptButtons([{ name: '🔮悬浮球管理', visible: true }]);
  eventOn(getButtonEvent('🔮悬浮球管理'), function() {
    if (trayOpen) closeTray();
    else openTray();
  });

  setTimeout(function() {
    createTrigger();
    buildTray();
    applyCaptures();
    updateBadge();
    startReinforce();
  }, 2000);

})();
