/* ==========================================================================
   store.js – ניהול מצב מקומי
   כל הנתונים נשמרים אך ורק ב-localStorage של הדפדפן של המשתמש.
   אין שרת, אין חשבון, אין העברת מידע לצד שלישי. ראו מדיניות פרטיות.
   ========================================================================== */

const Store = (() => {
  const KEY = "nagen.state.v1";

  const DEFAULT = {
    profile: { name:"", age:"", goal:"", dailyGoal: APP.dailyGoalDefault, createdAt: null },
    currentInstrument: null,
    completed: {},          // { "piano-1": {at, score} }
    xp: 0,
    minutes: 0,             // סה"כ דקות תרגול
    days: {},               // { "2026-08-30": minutes }
    streak: 0,
    lastDay: null,
    badges: [],
    quizStreak: 0,
    earCorrect: 0,
    journal: [],            // יומן תרגול
    mastered: {},           // { songId: {at, inst} } – שירים שאני כבר יודע לנגן
    recitals: {},           // { instId: {at, name} } – תעודות סיום שהופקו
    lastBackup: null,       // { at, how } – מתי בוצע הגיבוי האחרון
    records: {},            // { "guitar:Em>Am": 42 } – שיאי מעברי אקורדים
    playAlong: {},          // { songId: bestPct } – שיאי מאמן הנגינה
    readScore: { best:0, total:0, right:0 },
    plan: null,             // {id, at, price, invoice} – מנוי פעיל (הדגמה)
    settings: { theme:"dark", volume:.8, muted:false, notenames:false },
    a11y: {},
    consent: null           // אישור מדיניות פרטיות
  };

  let s = load();

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return structuredClone(DEFAULT);
      const parsed = JSON.parse(raw);
      return deepMerge(structuredClone(DEFAULT), parsed);
    }catch(e){ return structuredClone(DEFAULT); }
  }
  function deepMerge(base, add){
    for(const k in add){
      if(add[k] && typeof add[k] === "object" && !Array.isArray(add[k]) && base[k] && typeof base[k] === "object")
        deepMerge(base[k], add[k]);
      else base[k] = add[k];
    }
    return base;
  }
  function save(){
    try{ localStorage.setItem(KEY, JSON.stringify(s)); }
    catch(e){ console.warn("שמירה מקומית נכשלה", e); }
    document.dispatchEvent(new CustomEvent("store:change"));
  }

  const today = () => new Date().toISOString().slice(0,10);

  /* ---------- הרשאות גישה ---------- */
  function isPro(){ return !!(s.plan && s.plan.id); }
  function isUnlocked(lesson){
    if(isPro()) return true;
    return lesson.n <= APP.freeLessons;
  }

  /* ---------- התקדמות ---------- */
  function isDone(id){ return !!s.completed[id]; }
  function completeLesson(id, score){
    const first = !s.completed[id];
    s.completed[id] = { at: new Date().toISOString(), score: score || 0 };
    const les = LESSON_BY_ID[id];
    if(first && les) addXp(les.xp || 20);
    save();
    checkBadges();
    return first;
  }
  function instProgress(instId){
    const list = LESSONS_BY_INST[instId] || [];
    const done = list.filter(l => isDone(l.id)).length;
    return { done, total: list.length, pct: list.length ? Math.round(done / list.length * 100) : 0 };
  }
  function totalDone(){ return Object.keys(s.completed).length; }
  function nextLesson(instId){
    const list = LESSONS_BY_INST[instId] || [];
    return list.find(l => !isDone(l.id)) || list[list.length - 1];
  }
  function startedInstruments(){
    return INSTRUMENTS.filter(i => (LESSONS_BY_INST[i.id] || []).some(l => isDone(l.id)));
  }

  /* ---------- XP ודרגות ---------- */
  function addXp(n){ s.xp += n; save(); }
  function level(){ return Math.floor(Math.sqrt(s.xp / 40)) + 1; }
  function levelProgress(){
    const lv = level();
    const cur = 40 * Math.pow(lv - 1, 2), next = 40 * Math.pow(lv, 2);
    return { lv, cur: s.xp - cur, need: next - cur, pct: Math.round((s.xp - cur) / (next - cur) * 100) };
  }

  /* ---------- תרגול ורצף ימים ---------- */
  function logPractice(minutes, note){
    const d = today();
    s.days[d] = (s.days[d] || 0) + minutes;
    s.minutes += minutes;
    if(s.lastDay !== d){
      const y = new Date(Date.now() - 864e5).toISOString().slice(0,10);
      s.streak = (s.lastDay === y) ? s.streak + 1 : 1;
      s.lastDay = d;
    }
    if(note) s.journal.unshift({ at:new Date().toISOString(), minutes, note });
    s.journal = s.journal.slice(0, 60);
    addXp(Math.round(minutes * 2));
    save(); checkBadges();
  }
  function week(){
    const out = [];
    for(let i = 6; i >= 0; i--){
      const d = new Date(Date.now() - i * 864e5).toISOString().slice(0,10);
      out.push({ date:d, min: s.days[d] || 0 });
    }
    return out;
  }

  /* ---------- תגים ---------- */
  function award(id){
    if(s.badges.includes(id)) return false;
    s.badges.push(id); save();
    const b = BADGES.find(x => x.id === id);
    if(b) document.dispatchEvent(new CustomEvent("badge", { detail:b }));
    return true;
  }
  function checkBadges(){
    const done = totalDone();
    if(done >= 1) award("first");
    if(done >= 3) award("three");
    if(done >= 10) award("ten");
    if(s.streak >= 3) award("streak3");
    if(s.streak >= 7) award("streak7");
    if(startedInstruments().length >= 2) award("multi");
    if(s.earCorrect >= 10) award("ear");
    if(s.minutes >= 60) award("hour");
    if(s.quizStreak >= 5) award("quizace");
    if(level() >= 5) award("level5");
    const mc = Object.keys(s.mastered).length;
    if(mc >= 1) award("rep1");
    if(mc >= 5) award("rep5");
    if(mc >= 10) award("rep10");
    if(mc >= 25) award("rep25");
    if(mc >= 50) award("rep50");
    if(Object.keys(s.mastered).some(id => (SONG_BY_ID[id] || {}).level >= 5)) award("virtuoso");
    if(Object.keys(s.recitals).length >= 1) award("recital");
    if(Object.keys(s.recitals).length >= 3) award("maestro");
    if(Object.values(s.playAlong).some(p => p >= 90)) award("coach90");
    if(Object.values(s.records).some(n => n >= 60)) award("fast60");
  }

  /* ---------- גיבוי ועמידות נתונים ---------- */
  function hasProgress(){
    return !!(Object.keys(s.completed).length || Object.keys(s.mastered).length || s.minutes > 0);
  }
  function markBackup(how){
    s.lastBackup = { at: new Date().toISOString(), how: how || "manual" };
    try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch(e){}   // ללא dispatch – למניעת לולאה
  }
  function daysSinceBackup(){
    if(!s.lastBackup || !s.lastBackup.at) return null;
    return Math.floor((Date.now() - new Date(s.lastBackup.at).getTime()) / 864e5);
  }
  /* האם כדאי להזכיר למשתמש לגבות: יש התקדמות של ממש ולא גובתה 14 יום */
  function backupDue(){
    if(!hasProgress()) return false;
    const d = daysSinceBackup();
    return d === null ? (Object.keys(s.completed).length >= 3) : d >= 14;
  }

  /* ---------- שיאים אישיים ---------- */
  function chordRecord(inst, from, to){
    return s.records[inst + ":" + from + ">" + to] || 0;
  }
  function setChordRecord(inst, from, to, n){
    const k = inst + ":" + from + ">" + to;
    if(n > (s.records[k] || 0)){ s.records[k] = n; addXp(10); save(); return true; }
    return false;
  }
  function chordRecords(){
    return Object.entries(s.records).map(([k, v]) => {
      const [inst, pair] = k.split(":");
      const [from, to] = pair.split(">");
      return { inst, from, to, n: v };
    }).sort((a, b) => b.n - a.n);
  }
  function playAlongBest(songId){ return s.playAlong[songId] || 0; }
  function setPlayAlongBest(songId, pct){
    if(pct > (s.playAlong[songId] || 0)){
      s.playAlong[songId] = pct; addXp(20); save(); checkBadges(); return true;
    }
    save(); return false;
  }

  /* ---------- רפרטואר: שירים שאני יודע לנגן ---------- */
  function isMastered(songId){ return !!s.mastered[songId]; }
  function toggleMastered(songId, instId){
    if(s.mastered[songId]){ delete s.mastered[songId]; }
    else {
      s.mastered[songId] = { at:new Date().toISOString(), inst: instId || s.currentInstrument || "piano" };
      addXp(15);
    }
    save(); checkBadges();
    return isMastered(songId);
  }
  function masteredList(instId){
    return Object.entries(s.mastered)
      .filter(([id, v]) => !instId || v.inst === instId)
      .map(([id, v]) => ({ song: SONG_BY_ID[id], at: v.at, inst: v.inst }))
      .filter(x => x.song)
      .sort((a, b) => a.song.level - b.song.level);
  }
  function masteredCount(instId){ return masteredList(instId).length; }
  function maxMasteredLevel(instId){
    const l = masteredList(instId).map(x => x.song.level);
    return l.length ? Math.max(...l) : 0;
  }

  /* ---------- רסיטל סיום ותעודה ---------- */
  const RECITAL_REQ = { lessons: 1, songs: 8, topLevel: 3 };
  function recitalStatus(instId){
    const p = instProgress(instId);
    const songs = masteredCount(instId);
    const top = maxMasteredLevel(instId);
    const checks = [
      { id:"lessons", ok: p.done >= p.total, have: p.done, need: p.total },
      { id:"songs",   ok: songs >= RECITAL_REQ.songs, have: songs, need: RECITAL_REQ.songs },
      { id:"level",   ok: top >= RECITAL_REQ.topLevel, have: top, need: RECITAL_REQ.topLevel }
    ];
    return { checks, ready: checks.every(c => c.ok), granted: !!s.recitals[instId], cert: s.recitals[instId] };
  }
  function grantRecital(instId, name){
    if(s.recitals[instId]) return s.recitals[instId];
    s.recitals[instId] = {
      at: new Date().toISOString(),
      name: name || s.profile.name || "",
      id: "NG-" + instId.slice(0,2).toUpperCase() + "-" + Date.now().toString(36).toUpperCase(),
      songs: masteredList(instId).map(x => x.song.id)
    };
    addXp(200); save(); checkBadges();
    return s.recitals[instId];
  }

  /* ---------- מנוי (הדגמה) ---------- */
  function activatePlan(planId, price, coupon){
    const p = PLANS.find(x => x.id === planId);
    s.plan = {
      id: planId, name: p ? p.name : planId, price,
      coupon: coupon || null,
      at: new Date().toISOString(),
      invoice: "DEMO-" + Date.now().toString(36).toUpperCase()
    };
    save();
    return s.plan;
  }
  function cancelPlan(){ s.plan = null; save(); }

  /* ---------- שונות ---------- */
  function reset(){ s = structuredClone(DEFAULT); save(); }
  function exportData(){ return JSON.stringify(s, null, 2); }
  function importData(json){
    try{ s = deepMerge(structuredClone(DEFAULT), JSON.parse(json)); save(); return true; }
    catch(e){ return false; }
  }

  return {
    get state(){ return s; }, save, today,
    isPro, isUnlocked, isDone, completeLesson, instProgress, totalDone, nextLesson, startedInstruments,
    addXp, level, levelProgress, logPractice, week,
    isMastered, toggleMastered, masteredList, masteredCount, maxMasteredLevel,
    hasProgress, markBackup, daysSinceBackup, backupDue,
    chordRecord, setChordRecord, chordRecords, playAlongBest, setPlayAlongBest,
    recitalStatus, grantRecital, RECITAL_REQ,
    award, checkBadges, activatePlan, cancelPlan,
    reset, exportData, importData
  };
})();
