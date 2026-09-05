/* ==========================================================================
   app.js – ניתוב, רב-לשוניות, סרגל נגישות, ערכת נושא, הודעות ואתחול
   ========================================================================== */

const App = (() => {
  const main = () => document.getElementById("main");

  /* ---------------- ניתוב ---------------- */
  const ROUTES = [
    [/^\/?$/,                       (m) => Views.home(m)],
    [/^\/instruments$/,             (m) => Views.instruments(m)],
    [/^\/instrument\/(.+)$/,        (m, a) => Views.instrument(m, a)],
    [/^\/lesson\/(.+)$/,            (m, a) => Views.lesson(m, a)],
    [/^\/songs$/,                   (m) => Repertoire.songs(m)],
    [/^\/repertoire$/,              (m) => Repertoire.mine(m)],
    [/^\/recital\/(.+)$/,           (m, a) => Repertoire.recital(m, a)],
    [/^\/certificate\/(.+)$/,       (m, a) => Repertoire.certificate(m, a)],
    [/^\/progress$/,                (m) => Views.progress(m)],
    [/^\/pricing$/,                 (m) => Views.pricing(m)],
    [/^\/checkout\/(.+)$/,          (m, a) => Views.checkout(m, a)],
    [/^\/faq$/,                     (m) => Views.faq(m)],
    [/^\/tools$/,                   (m) => Tools.hub(m)],
    [/^\/tools\/metronome$/,        (m) => Tools.metronome(m)],
    [/^\/tools\/tuner$/,            (m) => Tools.tuner(m)],
    [/^\/tools\/ear$/,              (m) => Tools.ear(m)],
    [/^\/tools\/chords$/,           (m) => Tools.chords(m)],
    [/^\/tools\/timer$/,            (m) => Tools.timer(m)],
    [/^\/tools\/scales$/,           (m) => Tools.scales(m)],
    [/^\/tools\/backing(?:\/(.+))?$/, (m, a) => Practice.backing(m, a)],
    [/^\/tools\/coach(?:\/(.+))?$/,   (m, a) => Practice.coach(m, a)],
    [/^\/tools\/changes$/,            (m) => Practice.changes(m)],
    [/^\/tools\/reading$/,            (m) => Practice.reading(m)],
    [/^\/report$/,                     (m) => Practice.report(m)],
    [/^\/guide(?:\/(.+))?$/,            (m, a) => Guide.view(m, a)],
    [/^\/storage$/,                    (m) => Views.storage(m)],
    [/^\/legal\/privacy$/,          (m) => Legal.privacy(m)],
    [/^\/legal\/accessibility$/,    (m) => Legal.accessibility(m)],
    [/^\/legal\/terms$/,            (m) => Legal.terms(m)],
    [/^\/legal\/credits$/,          (m) => Legal.credits(m)]
  ];

  function render(){
    const path = (location.hash || "#/").replace(/^#/, "");
    Tools.reset();
    Practice.reset();
    if(typeof Guide !== "undefined") Guide.reset();
    Audio1.stopSequence();
    applyChrome();
    const m = main();
    let matched = false;
    for(const [re, fn] of ROUTES){
      const g = re.exec(path);
      if(g){ fn(m, g[1]); matched = true; break; }
    }
    if(!matched) Views.notFound(m);

    window.scrollTo({ top:0, behavior: document.documentElement.dataset.nomotion === "1" ? "auto" : "smooth" });
    m.focus({ preventScroll:true });
    document.querySelectorAll(".mainnav a, .mobilenav a").forEach(a => {
      const on = a.getAttribute("href") === (location.hash || "#/");
      if(on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    const nav = document.getElementById("mobileNav");
    if(nav && !nav.hidden){ nav.hidden = true; document.getElementById("navBtn").setAttribute("aria-expanded", "false"); }
    if(typeof Device !== "undefined") Device.syncTabBar();
    const pageT = titleFor(path), appT = t("app.name");
    document.title = pageT === appT ? appT : pageT + " · " + appT;
  }

  function titleFor(path){
    const seg = path.split("/");
    if(path.startsWith("/lesson/")){
      const l = LESSON_BY_ID[seg[2]];
      return l ? t("inst.lessonN", { n:l.n }) + ": " + I18N.lesson(l).title : t("inst.lessonN", { n:"" });
    }
    if(path.startsWith("/recital/"))     return t("recital.h1", { inst: I18N.instName(seg[2]) || "" });
    if(path.startsWith("/certificate/")) return t("cert.title");
    if(path.startsWith("/instrument/"))  return I18N.instName(seg[2]) || t("nav.instruments");
    if(path.startsWith("/tools/backing")) return t("tools.backing");
    if(path.startsWith("/tools/coach"))   return t("tools.playalong");
    const map = {
      "/":"app.tagline", "/instruments":"nav.instruments", "/songs":"nav.songs",
      "/repertoire":"nav.repertoire", "/progress":"nav.progress", "/pricing":"nav.pricing",
      "/faq":"nav.faq", "/tools":"nav.tools", "/tools/metronome":"tools.metronome",
      "/tools/tuner":"tools.tuner", "/tools/ear":"tools.ear", "/tools/chords":"tools.chords",
      "/tools/timer":"tools.timer", "/tools/scales":"tools.scales",
      "/tools/backing":"tools.backing", "/tools/coach":"tools.playalong",
      "/tools/changes":"tools.changes", "/tools/reading":"tools.reading",
      "/report":"report.h1", "/storage":"st.h1", "/guide":"tools.guide",
      "/legal/privacy":"legal.privacy.title", "/legal/accessibility":"legal.a11y.title",
      "/legal/terms":"legal.terms.title", "/legal/credits":"legal.credits.title"
    };
    return map[path] ? t(map[path]) : t("nf.h");
  }

  /* ---------------- מילוי מחרוזות בשלד הקבוע ---------------- */
  function applyChrome(){
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    document.querySelectorAll("[data-i18n-title]").forEach(el => el.setAttribute("title", t(el.dataset.i18nTitle) + " (Alt+0)"));
    ["brandTxt","brandTxt2","footBrand"].forEach(id => {
      const el = document.getElementById(id); if(el) el.textContent = t("app.name");
    });
    const md = document.getElementById("metaDesc");
    if(md) md.setAttribute("content", t("app.desc", { n: SONGS.length }));
    const lb = document.getElementById("langBtn");
    if(lb) lb.textContent = I18N.lang().toUpperCase();
  }

  /* ---------------- תפריט שפות ---------------- */
  function initLang(){
    const btn = document.getElementById("langBtn");
    const menu = document.getElementById("langMenu");
    menu.innerHTML = I18N.list().map(l =>
      `<button role="menuitemradio" class="lang-item${l.code === I18N.lang() ? " on" : ""}"
        data-lang="${l.code}" lang="${l.code}" dir="${l.dir}"
        aria-checked="${l.code === I18N.lang()}">
        <span aria-hidden="true">${l.flag}</span> ${l.native}</button>`).join("");

    const open = v => { menu.hidden = !v; btn.setAttribute("aria-expanded", v ? "true" : "false");
                        if(v) menu.querySelector("button").focus(); };
    btn.addEventListener("click", () => open(menu.hidden));
    document.addEventListener("click", e => {
      if(!menu.hidden && !menu.contains(e.target) && e.target !== btn) open(false);
    });
    menu.addEventListener("keydown", e => { if(e.key === "Escape"){ open(false); btn.focus(); } });
    menu.querySelectorAll("[data-lang]").forEach(b => b.addEventListener("click", async () => {
      open(false);
      toast(t("common.loading"));
      await I18N.set(b.dataset.lang);
      menu.querySelectorAll("[data-lang]").forEach(x => {
        const on = x.dataset.lang === I18N.lang();
        x.classList.toggle("on", on); x.setAttribute("aria-checked", on);
      });
      toast(I18N.info().native);
    }));
  }

  /* ---------------- הודעות ומודאלים ---------------- */
  let toastT = null;
  function toast(msg){
    const el = document.getElementById("toast");
    el.textContent = msg; el.hidden = false;
    UI.live(msg);
    clearTimeout(toastT);
    toastT = setTimeout(() => el.hidden = true, 3600);
  }

  function modal(html, onClose){
    const root = document.getElementById("modalRoot");
    root.innerHTML = `<div class="modal-back" role="presentation">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-x"><button class="icon-btn" id="mClose" aria-label="${UI.esc(t("common.close"))}">✕</button></div>
        <div id="mBody">${html}</div>
      </div></div>`;
    const back = root.firstElementChild;
    const close = () => { root.innerHTML = ""; if(onClose) onClose(); };
    root.querySelector("#mClose").addEventListener("click", close);
    back.addEventListener("click", e => { if(e.target === back) close(); });
    document.addEventListener("keydown", function esc(e){
      if(e.key === "Escape"){ close(); document.removeEventListener("keydown", esc); }
    });
    root.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
    const f = root.querySelector("button, a, input");
    if(f) f.focus();
  }

  function confirmBox(title, text, onYes){
    modal(`<h2>${UI.esc(title)}</h2><p>${UI.esc(text)}</p>
      <div class="row"><button class="btn" id="yesBtn">${UI.esc(t("common.confirm"))}</button>
      <button class="btn btn-ghost" id="noBtn">${UI.esc(t("common.cancel"))}</button></div>`);
    document.getElementById("yesBtn").addEventListener("click", () => {
      document.getElementById("modalRoot").innerHTML = ""; onYes();
    });
    document.getElementById("noBtn").addEventListener("click", () => document.getElementById("modalRoot").innerHTML = "");
  }

  /* ---------------- ערכת נושא ---------------- */
  function applyTheme(th){
    document.documentElement.dataset.theme = th;
    Store.state.settings.theme = th; Store.save();
  }

  /* ---------------- סרגל נגישות ---------------- */
  const A11Y_TOGGLES = ["hc","inv","gray","links","readable","spacing","nomotion","bigcursor","guide","focus","visual","vibrate","notenames","nocolor"];
  let fontSize = 100;

  function applyA11y(){
    const a = Store.state.a11y || {};
    A11Y_TOGGLES.forEach(k => {
      if(a[k]) document.documentElement.dataset[k] = "1";
      else delete document.documentElement.dataset[k];
      const btn = document.querySelector(`[data-toggle="${k}"]`);
      if(btn) btn.setAttribute("aria-pressed", a[k] ? "true" : "false");
    });
    fontSize = a.font || 100;
    document.documentElement.style.setProperty("--fs", fontSize + "%");
    const out = document.getElementById("fontOut");
    if(out) out.textContent = fontSize + "%";
    const guide = document.getElementById("readingGuide");
    if(guide) guide.hidden = !a.guide;
  }

  function initA11y(){
    const panel = document.getElementById("a11yPanel");
    const fab = document.getElementById("a11yToggle");
    const open = v => {
      panel.hidden = !v;
      fab.setAttribute("aria-expanded", v ? "true" : "false");
      if(v) panel.querySelector("button").focus();
    };
    fab.addEventListener("click", () => open(panel.hidden));
    document.getElementById("a11yClose").addEventListener("click", () => { open(false); fab.focus(); });

    document.querySelectorAll("[data-toggle]").forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.toggle;
      const a = Store.state.a11y;
      a[k] = !a[k]; Store.save(); applyA11y();
      UI.live(b.textContent.trim() + " – " + (a[k] ? t("a11y.on") : t("a11y.off")));
      if(k === "vibrate" && a[k] && navigator.vibrate) navigator.vibrate(80);
      if(k === "visual" && a[k]) toast(t("a11y.visualOn"));
    }));

    document.querySelectorAll("[data-a11y]").forEach(b => b.addEventListener("click", () => {
      const a = Store.state.a11y;
      fontSize = Math.max(80, Math.min(180, (a.font || 100) + (b.dataset.a11y === "font+" ? 10 : -10)));
      a.font = fontSize; Store.save(); applyA11y();
      UI.live(t("a11y.font") + " " + fontSize + "%");
    }));

    document.getElementById("a11yReset").addEventListener("click", () => {
      Store.state.a11y = {}; Store.save(); applyA11y();
      toast(t("a11y.resetDone"));
    });

    document.addEventListener("keydown", e => {
      if(e.altKey && e.key === "0"){ e.preventDefault(); open(panel.hidden); }
    });

    document.addEventListener("mousemove", e => {
      const g = document.getElementById("readingGuide");
      if(g && !g.hidden) g.style.top = (e.clientY - 22) + "px";
    });
  }

  /* ---------------- אתחול ---------------- */
  async function init(){
    document.getElementById("yr").textContent = new Date().getFullYear();

    applyTheme(Store.state.settings.theme || "dark");
    applyA11y();

    await I18N.set(I18N.detect(), true);
    initLang();
    applyChrome();

    document.getElementById("themeBtn").addEventListener("click", () => {
      applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    });
    document.getElementById("navBtn").addEventListener("click", e => {
      const nav = document.getElementById("mobileNav");
      nav.hidden = !nav.hidden;
      e.currentTarget.setAttribute("aria-expanded", nav.hidden ? "false" : "true");
    });

    initA11y();
    Device.init();
    document.addEventListener("device:change", () => render());

    document.addEventListener("badge", e => {
      toast(t("badge.new", { ico:e.detail.ico, name:I18N.badgeName(e.detail) }));
    });

    const unlock = () => { Audio1.ensure(); document.removeEventListener("pointerdown", unlock); };
    document.addEventListener("pointerdown", unlock);

    window.addEventListener("hashchange", render);
    render();

    /* שכבת עמידות הנתונים – שחזור אוטומטי, מראה ב-IndexedDB וגיבוי לקובץ */
    Backup.init().then(r => {
      if(r && r.restored){ toast(t("st.restored")); render(); }
      setTimeout(backupReminder, 2500);
    }).catch(() => {});

    /* הודעת אחסון – שקיפות לפני שמתחילים לשמור */
    if(typeof Consent !== "undefined") setTimeout(Consent.show, 400);

    if(!Store.state.profile.createdAt){
      Store.state.profile.createdAt = new Date().toISOString();
      Store.save();
      setTimeout(welcome, 700);
    }

    if("serviceWorker" in navigator && location.protocol !== "file:"){
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  /* תזכורת גיבוי – מוצגת פעם ביום לכל היותר, ורק כשיש מה לאבד */
  function backupReminder(){
    if(!Store.backupDue()) return;
    if(sessionStorage.getItem("nagen.backupAsked")) return;
    try{ sessionStorage.setItem("nagen.backupAsked", "1"); }catch(e){}
    const d = Store.daysSinceBackup();
    modal(`<h2>${t("st.dueTitle")}</h2>
      <p>${d === null ? t("st.dueNever") : t("st.dueBody", { n:d })}</p>
      <div class="row">
        <button class="btn" id="bkNow">${t("st.dueBtn")}</button>
        <a class="btn btn-ghost" href="#/storage">${t("st.h1")}</a>
      </div>`);
    const b = document.getElementById("bkNow");
    if(b) b.addEventListener("click", () => {
      document.getElementById("modalRoot").innerHTML = "";
      Backup.canShare() ? Backup.shareBackup() : Backup.downloadBackup();
      toast(t("st.exported"));
    });
  }

  function welcome(){
    modal(`<h2>${t("welcome.h", { app:t("app.name") })}</h2>
      <p>${t("welcome.p")}</p>
      <ul>
        <li>${t("welcome.l1", { free:APP.freeLessons, n:APP.freeLessons * INSTRUMENTS.length })}</li>
        <li>${t("welcome.l2", { songs:SONGS.length })}</li>
        <li>${t("welcome.l3")}</li>
        <li>${t("welcome.l4")}</li>
      </ul>
      <p class="muted">${t("welcome.legal")}</p>
      <a class="btn w100" href="#/instruments">${t("welcome.cta")}</a>`);
  }

  return { render, toast, modal, confirm: confirmBox, init, applyA11y, applyChrome };
})();

document.addEventListener("DOMContentLoaded", App.init);
