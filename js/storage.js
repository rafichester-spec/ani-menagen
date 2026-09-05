/* ==========================================================================
   storage.js – שכבת עמידות הנתונים
   --------------------------------------------------------------------------
   הבעיה: localStorage לבדו הוא זיכרון שביר. הדפדפן רשאי למחוק אותו כשנגמר
   מקום, ניקוי "נתוני אתרים" מוחק אותו, וגלישה פרטית לא שומרת אותו בכלל.
   משתמש שהשקיע חודשים ברפרטואר ובתעודה עלול לאבד הכול בלחיצה אחת.

   הפתרון כאן בנוי בארבע שכבות, כולן ללא שרת וללא פגיעה בהבטחת הפרטיות:
     1. בקשת "אחסון קבוע" מהדפדפן  – מונעת מחיקה אוטומטית בעת מחסור במקום.
     2. עותק מראה ב-IndexedDB      – מנגנון נפרד עם מכסה גדולה יותר; אם
                                      localStorage נמחק, המידע משוחזר ממנו.
     3. גיבוי אוטומטי לקובץ        – המשתמש בוחר קובץ פעם אחת, והאפליקציה
                                      כותבת אליו בכל שינוי (File System Access).
     4. תזכורת גיבוי + ייצוא/שיתוף – רשת ביטחון אחרונה, כולל Web Share בנייד.
   ========================================================================== */

const Backup = (() => {
  const DB_NAME = "nagen", DB_VER = 1, STORE = "kv";
  const K_STATE = "state", K_HANDLE = "backupFile";

  let db = null, mirrorTimer = null, fileHandle = null, fileReady = false;

  /* ---------------- IndexedDB ---------------- */
  function open(){
    if(db) return Promise.resolve(db);
    return new Promise((res, rej) => {
      if(!("indexedDB" in window)) return rej(new Error("no idb"));
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => {
        const d = req.result;
        if(!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
      };
      req.onsuccess = () => { db = req.result; res(db); };
      req.onerror = () => rej(req.error);
    });
  }
  async function idbSet(key, val){
    try{
      const d = await open();
      return new Promise((res, rej) => {
        const tx = d.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(val, key);
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      });
    }catch(e){ return null; }
  }
  async function idbGet(key){
    try{
      const d = await open();
      return new Promise((res) => {
        const tx = d.transaction(STORE, "readonly");
        const r = tx.objectStore(STORE).get(key);
        r.onsuccess = () => res(r.result);
        r.onerror = () => res(undefined);
      });
    }catch(e){ return undefined; }
  }
  async function idbDel(key){
    try{
      const d = await open();
      return new Promise(res => {
        const tx = d.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = res; tx.onerror = res;
      });
    }catch(e){ return null; }
  }

  /* ---------------- אחסון קבוע ---------------- */
  async function isPersisted(){
    try{ return navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : false; }
    catch(e){ return false; }
  }
  async function requestPersist(){
    try{
      if(!(navigator.storage && navigator.storage.persist)) return false;
      return await navigator.storage.persist();
    }catch(e){ return false; }
  }
  async function estimate(){
    try{
      if(!(navigator.storage && navigator.storage.estimate)) return null;
      const e = await navigator.storage.estimate();
      return { usage: e.usage || 0, quota: e.quota || 0 };
    }catch(e){ return null; }
  }

  /* ---------------- גיבוי אוטומטי לקובץ ---------------- */
  function fileApiSupported(){ return typeof window.showSaveFilePicker === "function"; }

  async function pickBackupFile(){
    if(!fileApiSupported()) return false;
    try{
      const h = await window.showSaveFilePicker({
        suggestedName: "nagen-backup.json",
        types: [{ description: "JSON", accept: { "application/json": [".json"] } }]
      });
      fileHandle = h; fileReady = true;
      await idbSet(K_HANDLE, h);
      await writeFile(Store.exportData());
      return true;
    }catch(e){ return false; }   // המשתמש ביטל
  }

  async function restoreHandle(){
    if(!fileApiSupported()) return;
    const h = await idbGet(K_HANDLE);
    if(!h) return;
    fileHandle = h;
    try{
      const perm = await h.queryPermission({ mode: "readwrite" });
      fileReady = perm === "granted";   // "prompt" ידרוש מחווה של המשתמש
    }catch(e){ fileReady = false; }
  }

  async function grantFilePermission(){
    if(!fileHandle) return false;
    try{
      const p = await fileHandle.requestPermission({ mode: "readwrite" });
      fileReady = p === "granted";
      if(fileReady) await writeFile(Store.exportData());
      return fileReady;
    }catch(e){ return false; }
  }

  async function writeFile(text){
    if(!fileHandle || !fileReady) return false;
    try{
      const w = await fileHandle.createWritable();
      await w.write(text);
      await w.close();
      Store.markBackup("file");
      return true;
    }catch(e){ fileReady = false; return false; }
  }

  async function stopFileBackup(){
    fileHandle = null; fileReady = false;
    await idbDel(K_HANDLE);
  }

  function fileName(){ return fileHandle ? fileHandle.name : null; }
  function fileActive(){ return !!(fileHandle && fileReady); }
  function filePending(){ return !!(fileHandle && !fileReady); }

  /* ---------------- ייצוא / שיתוף ---------------- */
  function exportBlob(){
    return new Blob([Store.exportData()], { type: "application/json" });
  }
  function downloadBackup(){
    const a = document.createElement("a");
    a.href = URL.createObjectURL(exportBlob());
    a.download = "nagen-backup-" + Store.today() + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    Store.markBackup("download");
  }
  function canShare(){
    try{
      return !!(navigator.canShare && navigator.canShare({
        files: [new File(["{}"], "t.json", { type: "application/json" })]
      }));
    }catch(e){ return false; }
  }
  async function shareBackup(){
    try{
      const file = new File([Store.exportData()],
        "nagen-backup-" + Store.today() + ".json", { type: "application/json" });
      if(navigator.canShare && navigator.canShare({ files: [file] })){
        await navigator.share({ files: [file], title: APP.name + " – " + t("st.h1") });
        Store.markBackup("share");
        return true;
      }
    }catch(e){}
    downloadBackup();
    return false;
  }

  /* ---------------- מראה + שחזור ---------------- */
  function mirror(){
    clearTimeout(mirrorTimer);
    mirrorTimer = setTimeout(async () => {
      const json = Store.exportData();
      await idbSet(K_STATE, json);
      if(fileActive()) writeFile(json);
    }, 600);
  }

  /* מנסה לשחזר מ-IndexedDB אם האחסון המקומי ריק או פגום.
     מחזיר true אם בוצע שחזור. */
  async function restoreIfNeeded(){
    let local = null;
    try{ local = localStorage.getItem("nagen.state.v1"); }catch(e){}
    const mirrored = await idbGet(K_STATE);
    if(!mirrored) return false;

    let localMeaningful = false;
    if(local){
      try{
        const p = JSON.parse(local);
        localMeaningful = !!(p && (Object.keys(p.completed || {}).length ||
                                   Object.keys(p.mastered || {}).length || p.minutes));
      }catch(e){ localMeaningful = false; }
    }
    if(localMeaningful) return false;

    try{
      const p = JSON.parse(mirrored);
      const meaningful = Object.keys(p.completed || {}).length ||
                         Object.keys(p.mastered || {}).length || p.minutes;
      if(!meaningful) return false;
      Store.importData(mirrored);
      return true;
    }catch(e){ return false; }
  }

  /* ---------------- מצב בריאות האחסון ---------------- */
  async function health(){
    const est = await estimate();
    let localOk = false;
    try{ localStorage.setItem("__t", "1"); localStorage.removeItem("__t"); localOk = true; }catch(e){}
    return {
      localStorage: localOk,
      indexedDB: !!db || ("indexedDB" in window),
      persisted: await isPersisted(),
      canPersist: !!(navigator.storage && navigator.storage.persist),
      usage: est ? est.usage : null,
      quota: est ? est.quota : null,
      fileSupported: fileApiSupported(),
      fileActive: fileActive(),
      filePending: filePending(),
      fileName: fileName(),
      canShare: canShare(),
      lastBackup: Store.state.lastBackup || null,
      daysSinceBackup: Store.daysSinceBackup()
    };
  }

  /* ---------------- אתחול ---------------- */
  async function init(){
    let restored = false;
    try{
      await open();
      restored = await restoreIfNeeded();
      await restoreHandle();
      await idbSet(K_STATE, Store.exportData());   // מראה ראשוני
    }catch(e){}

    document.addEventListener("store:change", mirror);
    window.addEventListener("beforeunload", () => { try{ idbSet(K_STATE, Store.exportData()); }catch(e){} });

    /* בקשת אחסון קבוע – רק אם כבר יש התקדמות אמיתית, כדי לא להטריד משתמש חדש */
    if(!(await isPersisted()) && Store.hasProgress()) requestPersist();

    return { restored };
  }

  return { init, health, requestPersist, isPersisted, estimate,
           pickBackupFile, grantFilePermission, stopFileBackup,
           fileApiSupported, fileActive, filePending, fileName,
           downloadBackup, shareBackup, canShare, mirror };
})();
