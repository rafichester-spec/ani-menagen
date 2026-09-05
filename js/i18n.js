/* ==========================================================================
   i18n.js – מנוע רב-לשוני
   10 שפות, כולל שלוש שפות RTL (עברית, ערבית, פרסית עתידית).
   כל חבילת שפה נטענת לפי דרישה; עברית ואנגלית מוטמעות תמיד.
   ========================================================================== */

const I18N = (() => {

  const LANGS = [
    { code:"he", name:"עברית",     native:"עברית",      dir:"rtl", flag:"🇮🇱" },
    { code:"en", name:"אנגלית",    native:"English",    dir:"ltr", flag:"🇬🇧" },
    { code:"ar", name:"ערבית",     native:"العربية",    dir:"rtl", flag:"🇸🇦" },
    { code:"ru", name:"רוסית",     native:"Русский",    dir:"ltr", flag:"🇷🇺" },
    { code:"fr", name:"צרפתית",    native:"Français",   dir:"ltr", flag:"🇫🇷" },
    { code:"es", name:"ספרדית",    native:"Español",    dir:"ltr", flag:"🇪🇸" },
    { code:"de", name:"גרמנית",    native:"Deutsch",    dir:"ltr", flag:"🇩🇪" },
    { code:"pt", name:"פורטוגזית", native:"Português",  dir:"ltr", flag:"🇧🇷" },
    { code:"it", name:"איטלקית",   native:"Italiano",   dir:"ltr", flag:"🇮🇹" },
    { code:"am", name:"אמהרית",    native:"አማርኛ",       dir:"ltr", flag:"🇪🇹" }
  ];
  const LANG_BY_CODE = Object.fromEntries(LANGS.map(l => [l.code, l]));
  const DEFAULT = "he";
  const KEY = "nagen.lang";

  const packs = {};      // { he:{...}, en:{...} }
  const uiLoaded = {};   // אילו חבילות ממשק כבר נטענו (packs עשוי להתמלא חלקית מקבצים משותפים)
  const legalLoaded = {};
  const LEGAL_LANGS = ["he","en"];   // שפות שיש להן מסמכים משפטיים מלאים
  const lessonPacks = {}; // { en:{ "piano-1":{title,goal,b:[]} } }
  let cur = DEFAULT;

  /* ---------- רישום חבילות (נקרא מקובצי השפה) ---------- */
  function register(code, dict){ packs[code] = Object.assign(packs[code] || {}, dict); }
  function registerLessons(code, dict){ lessonPacks[code] = Object.assign(lessonPacks[code] || {}, dict); }

  /* ---------- תרגום ---------- */
  function t(key, vars){
    let s = (packs[cur] && packs[cur][key]);
    if(s === undefined) s = (packs.en && packs.en[key]);   // נפילה לאנגלית
    if(s === undefined) s = (packs.he && packs.he[key]);   // ואז לעברית
    if(s === undefined) s = key;
    if(vars) for(const k in vars) s = s.split("{" + k + "}").join(vars[k]);
    return s;
  }
  function has(key){ return !!(packs[cur] && packs[cur][key] !== undefined); }

  /* ---------- מידע על השפה הנוכחית ---------- */
  function lang(){ return cur; }
  function dir(){ return (LANG_BY_CODE[cur] || {}).dir || "rtl"; }
  function isRTL(){ return dir() === "rtl"; }
  function info(code){ return LANG_BY_CODE[code || cur]; }
  function list(){ return LANGS; }
  function loaded(code){ return !!uiLoaded[code]; }
  function hasLegal(code){ return !!legalLoaded[code || cur]; }

  /* ---------- טעינת חבילת שפה ---------- */
  const VER = "2.6.0";
  function loadScript(src){
    const url = src + "?v=" + VER;
    return new Promise((res, rej) => {
      if(document.querySelector('script[src="' + url + '"]')) return res();
      const sc = document.createElement("script");
      sc.src = url; sc.onload = res; sc.onerror = rej;
      document.head.appendChild(sc);
    });
  }
  async function ensure(code){
    if(!LANG_BY_CODE[code]) code = DEFAULT;
    const jobs = [];
    if(!uiLoaded[code]) jobs.push(loadScript("js/lang/ui-" + code + ".js").then(() => uiLoaded[code] = true).catch(() => {}));
    /* מסמכים משפטיים קיימים בעברית (המחייבת) ובאנגלית; שאר השפות נשענות על האנגלית
       ומציגות הודעה מקומית בראש המסמך (legal.langNote). */
    if(LEGAL_LANGS.includes(code) && !legalLoaded[code])
      jobs.push(loadScript("js/lang/legal-" + code + ".js").then(() => legalLoaded[code] = true).catch(() => {}));
    if(!lessonPacks[code] && code !== "he") jobs.push(loadScript("js/lang/lessons-" + code + ".js").catch(() => {}));
    
    await Promise.all(jobs);
  }

  /* ---------- החלפת שפה ---------- */
  async function set(code, silent){
    if(!LANG_BY_CODE[code]) return;
    await ensure(code);
    cur = code;
    try{ localStorage.setItem(KEY, code); }catch(e){}
    const L = LANG_BY_CODE[code];
    document.documentElement.lang = code;
    document.documentElement.dir = L.dir;
    document.documentElement.dataset.lang = code;
    document.dispatchEvent(new CustomEvent("lang:change", { detail:L }));
    if(!silent && typeof App !== "undefined" && App.render) App.render();
  }

  /* ---------- זיהוי שפה ראשונית ---------- */
  function detect(){
    let saved = null;
    try{ saved = localStorage.getItem(KEY); }catch(e){}
    if(saved && LANG_BY_CODE[saved]) return saved;
    const nav = (navigator.languages || [navigator.language || "he"]).map(x => String(x).slice(0,2).toLowerCase());
    for(const n of nav) if(LANG_BY_CODE[n]) return n;
    return DEFAULT;
  }

  /* ---------- תוכן שיעור מתורגם ---------- */
  function lesson(l){
    if(cur === "he" || !lessonPacks[cur] || !lessonPacks[cur][l.id]) return l;
    const p = lessonPacks[cur][l.id];
    const out = Object.assign({}, l);
    if(p.title) out.title = p.title;
    if(p.goal)  out.goal = p.goal;
    if(p.b) out.blocks = l.blocks.map((b, i) => mergeBlock(b, p.b[i]));   // תומך גם במערך וגם באובייקט לפי אינדקס
    return out;
  }
  function mergeBlock(b, tr){
    if(tr === undefined || tr === null) return b;
    const o = Object.assign({}, b);
    switch(b.t){
      case "text": case "tip": case "warn": o.html = tr; break;
      case "steps": o.items = Array.isArray(tr) ? tr : b.items; break;
      case "task":  o.html = typeof tr === "string" ? tr : (tr.html || b.html); break;
      case "piano": o.label = typeof tr === "string" ? tr : (tr.label || b.label); break;
      case "melody": case "rhythm": o.title = typeof tr === "string" ? tr : (tr.title || b.title); break;
      case "quiz":
        if(tr.q) o.q = tr.q;
        if(tr.o) o.opts = tr.o;
        if(tr.w) o.why = tr.w;
        break;
    }
    return o;
  }

  /* ---------- שמות מתורגמים לנתונים ---------- */
  function instName(id){ return has("inst." + id) ? t("inst." + id) : (INST[id] || {}).name; }
  function instBlurb(id){ return has("inst." + id + ".blurb") ? t("inst." + id + ".blurb") : (INST[id] || {}).blurb; }
  function instTag(id){ return has("inst." + id + ".tag") ? t("inst." + id + ".tag") : (INST[id] || {}).tag; }
  function songTitle(s){ return cur === "he" ? s.title : s.intl; }
  /* בסיס נחלת הכלל מורכב משדות מובנים (pd/who/year) ולא ממחרוזת קשיחה,
     כדי שהוא יתורגם לכל שפה במקום לדלוף בעברית. */
  function songSrc(s){
    if(s.pd === "death" && s.who) return t("pdsrc.death", { who:s.who, year:s.year });
    if(s.pd === "trad") return s.year ? t("pdsrc.tradYear", { year:s.year }) : t("pdsrc.trad");
    if(s.pd === "doc" && s.year) return t("pdsrc.doc", { year:s.year });
    return t("pdsrc.unknown");
  }
  function songOrigin(s){ return songSrc(s) + " · " + t("pd"); }
  function styleName(k){ return has("style." + k) ? t("style." + k) : (SONG_STYLES[k] || k); }
  function levelName(n){ return has("songlvl." + n) ? t("songlvl." + n) : (SONG_LEVELS.find(l => l.lvl === n) || {}).name; }
  function badgeName(b){ return has("badge." + b.id) ? t("badge." + b.id) : b.name; }
  function badgeDesc(b){ return has("badge." + b.id + ".d") ? t("badge." + b.id + ".d") : b.desc; }
  function planName(p){ return has("plan." + p.id) ? t("plan." + p.id) : p.name; }
  function planPer(p){ return has("plan." + p.id + ".per") ? t("plan." + p.id + ".per") : p.per; }
  function planPerks(p){ return has("plan." + p.id + ".perks") ? t("plan." + p.id + ".perks").split("|") : p.perks; }
  function chordName(inst, id){ return has("chord." + id) ? id + " (" + t("chord." + id) + ")" : id; }
  function chordTip(inst, c){ return has("chordtip." + inst + "." + c.id) ? t("chordtip." + inst + "." + c.id) : c.tip; }

  /* ---------- מספרים ותאריכים לפי לוקאל ---------- */
  const LOCALES = { he:"he-IL", en:"en-US", ar:"ar-EG", ru:"ru-RU", fr:"fr-FR",
                    es:"es-ES", de:"de-DE", pt:"pt-BR", it:"it-IT", am:"am-ET" };
  function locale(){ return LOCALES[cur] || "he-IL"; }
  function date(d){ try{ return new Date(d).toLocaleDateString(locale()); }catch(e){ return new Date(d).toLocaleDateString(); } }
  function dateTime(d){ try{ return new Date(d).toLocaleString(locale()); }catch(e){ return new Date(d).toLocaleString(); } }

  /* עברית ואנגלית מוטמעות ישירות ב-index.html */
  uiLoaded.he = true; uiLoaded.en = true;
  legalLoaded.he = true; legalLoaded.en = true;

  return { LANGS, register, registerLessons, t, has, lang, dir, isRTL, info, list, loaded, hasLegal,
           ensure, set, detect, lesson, instName, instBlurb, instTag, songTitle, songSrc,
           songOrigin, styleName, levelName, badgeName, badgeDesc, planName, planPer, planPerks,
           chordName, chordTip, locale, date, dateTime };
})();

/* קיצור גלובלי */
const t = (k, v) => I18N.t(k, v);
