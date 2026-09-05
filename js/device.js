/* ==========================================================================
   device.js – זיהוי סוג המכשיר והתאמת הממשק
   שלושה פרופילים: mobile (נייד), tablet (טאבלט), desktop (מחשב).
   ההתאמה אינה רק ויזואלית – היא משנה גם את הרכיבים עצמם:
   מספר האוקטבות במקלדת, גודל שטחי המגע, סוג הניווט ומצב הנגינה.
   ========================================================================== */

const Device = (() => {
  const BP = { mobile: 640, tablet: 1024 };   // נקודות שבירה בפיקסלים

  let cur = null, orient = null;

  function detect(){
    const w = window.innerWidth;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const noHover = window.matchMedia("(hover: none)").matches;
    const touch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;

    let kind;
    if(w < BP.mobile) kind = "mobile";
    else if(w < BP.tablet) kind = "tablet";
    else kind = touch && coarse && w < 1400 ? "tablet" : "desktop";

    return { kind, touch: touch || coarse, noHover, w, h: window.innerHeight,
             landscape: window.innerWidth > window.innerHeight };
  }

  function apply(){
    const d = detect();
    const root = document.documentElement;
    const changed = d.kind !== cur || (d.landscape ? "l" : "p") !== orient;
    cur = d.kind;
    orient = d.landscape ? "l" : "p";

    root.dataset.device = d.kind;
    root.dataset.input = d.touch ? "touch" : "mouse";
    root.dataset.orient = orient;
    if(d.noHover) root.dataset.nohover = "1"; else delete root.dataset.nohover;

    if(changed) document.dispatchEvent(new CustomEvent("device:change", { detail:d }));
    return d;
  }

  /* ---------- העדפות רכיבים לפי מכשיר ---------- */
  function pianoOctaves(requested){
    const d = detect();
    if(d.kind === "mobile") return d.landscape ? 2 : 1;   // בנייד לאורך – אוקטבה אחת גדולה
    if(d.kind === "tablet") return Math.min(requested || 2, 2);
    return requested || 2;
  }
  function songsPerPage(){ return cur === "mobile" ? 12 : cur === "tablet" ? 18 : 24; }
  function isMobile(){ return cur === "mobile"; }
  function isTablet(){ return cur === "tablet"; }
  function isDesktop(){ return cur === "desktop"; }
  function isTouch(){ return document.documentElement.dataset.input === "touch"; }
  function kind(){ return cur; }

  /* ---------- ניווט תחתון לנייד ---------- */
    /* אייקוני קו במקום אמוג'י: מראה אחיד בכל מערכת הפעלה,
     ויורשים את צבע הטקסט כך שמצב ניגודיות גבוהה חל עליהם. */
  const ICO = {
    home:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
    inst:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 5v9M15 5v9M3 14h18"/></svg>',
    songs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="3"/><circle cx="16.5" cy="16" r="3"/></svg>',
    tools: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3v18M5 8h5M12 3v18M12 14h5M19 3v18M16 6h5"/></svg>',
    prog:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20h18M6 17V9m5 8V5m5 12v-6"/></svg>'
  };

  const TABS = [
    { href:"#/",            ico:ICO.home,  key:"nav.home" },
    { href:"#/instruments", ico:ICO.inst,  key:"nav.instruments" },
    { href:"#/songs",       ico:ICO.songs, key:"nav.songs" },
    { href:"#/tools",       ico:ICO.tools, key:"nav.tools" },
    { href:"#/progress",    ico:ICO.prog,  key:"nav.progress" }
  ];
  function buildTabBar(){
    let bar = document.getElementById("tabbar");
    if(!bar){
      bar = document.createElement("nav");
      bar.id = "tabbar";
      bar.className = "tabbar";
      document.body.appendChild(bar);
    }
    bar.setAttribute("aria-label", "Main");
    bar.innerHTML = TABS.map(x => `<a href="${x.href}">
      <span class="tab-ico" aria-hidden="true">${x.ico}</span>
      <span class="tab-lbl">${UI.esc(t(x.key))}</span></a>`).join("");
    syncTabBar();
  }
  function syncTabBar(){
    const bar = document.getElementById("tabbar");
    if(!bar) return;
    const h = location.hash || "#/";
    bar.querySelectorAll("a").forEach(a => {
      const on = a.getAttribute("href") === h ||
                 (a.getAttribute("href") !== "#/" && h.startsWith(a.getAttribute("href")));
      if(on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }

  /* ---------- רמז סיבוב מסך לפסנתר בנייד ---------- */
  function rotateHint(){
    const d = detect();
    if(d.kind !== "mobile" || d.landscape) return null;
    const el = document.createElement("div");
    el.className = "rotate-hint";
    el.innerHTML = `<span aria-hidden="true">🔄</span> ${UI.esc(t("dev.rotate"))}`;
    return el;
  }

  /* ---------- התקנת PWA ---------- */
  let deferredPrompt = null;
  function initInstall(){
    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      deferredPrompt = e;
      document.dispatchEvent(new CustomEvent("pwa:available"));
    });
  }
  function canInstall(){ return !!deferredPrompt; }
  async function promptInstall(){
    if(!deferredPrompt) return false;
    deferredPrompt.prompt();
    const res = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return res && res.outcome === "accepted";
  }
  function isStandalone(){
    return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  }

  function init(){
    apply();
    buildTabBar();
    initInstall();
    let tmr = null;
    const onResize = () => { clearTimeout(tmr); tmr = setTimeout(apply, 150); };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", () => setTimeout(apply, 250));

    /* מאזיני שאילתות מדיה - אמינים יותר מ-resize בחלק מהדפדפנים */
    [`(max-width:${BP.mobile - 1}px)`,
     `(min-width:${BP.mobile}px) and (max-width:${BP.tablet - 1}px)`,
     `(min-width:${BP.tablet}px)`,
     "(orientation: landscape)",
     "(pointer: coarse)"].forEach(q => {
      const mq = window.matchMedia(q);
      if(mq.addEventListener) mq.addEventListener("change", apply);
      else if(mq.addListener) mq.addListener(apply);
    });
    /* רשת ביטחון: בדיקה תקופתית קלה */
    setInterval(() => { if(detect().kind !== cur) apply(); }, 1200);
    window.addEventListener("hashchange", syncTabBar);
    document.addEventListener("lang:change", buildTabBar);
  }

  return { init, apply, detect, kind, isMobile, isTablet, isDesktop, isTouch,
           pianoOctaves, songsPerPage, rotateHint, syncTabBar,
           canInstall, promptInstall, isStandalone };
})();
