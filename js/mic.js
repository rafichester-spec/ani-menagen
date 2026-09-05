/* ==========================================================================
   mic.js – בדיקת זמינות המיקרופון והסבר ברור למשתמש
   --------------------------------------------------------------------------
   הודעה כללית ("המיקרופון נכשל") לא עוזרת לאיש. יש חמש סיבות שונות שהמיקרופון
   לא עובד, ולכל אחת פתרון אחר — ובראשן זו שתופסת כמעט כל משתמש נייד:
   דפדפנים חוסמים גישה למיקרופון בכל כתובת שאינה https או localhost.
   ========================================================================== */

const Mic = (() => {

  /* האם ההקשר מאובטח? זה התנאי הראשון, ולפניו אין טעם לבקש הרשאה. */
  function secure(){
    if(window.isSecureContext) return true;
    const h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "::1";
  }

  function supported(){
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /* מצב ההרשאה מראש, בלי להקפיץ בקשה. לא כל דפדפן תומך. */
  async function permission(){
    try{
      if(!navigator.permissions || !navigator.permissions.query) return "unknown";
      const p = await navigator.permissions.query({ name: "microphone" });
      return p.state;                       // granted | denied | prompt
    }catch(e){ return "unknown"; }
  }

  /* מצב מלא: מה אפשר לעשות עכשיו, ומה להגיד למשתמש. */
  async function status(){
    if(!supported())  return { ok:false, reason:"unsupported" };
    if(!secure())     return { ok:false, reason:"insecure", host: location.host };
    const p = await permission();
    if(p === "denied") return { ok:false, reason:"denied" };
    return { ok:true, reason: p === "granted" ? "granted" : "prompt" };
  }

  /* טקסט מוסבר לכל מצב, כולל מה לעשות */
  function explain(st){
    switch(st.reason){
      case "unsupported": return t("mic.unsupported");
      case "insecure":    return t("mic.insecure", { host: st.host || location.host });
      case "denied":      return t("mic.denied");
      case "granted":     return t("mic.granted");
      default:            return t("mic.prompt");
    }
  }

  /* מרכיב תיבת הסבר להטמעה במסך. מחזיר null כשהכול תקין וההרשאה כבר ניתנה. */
  function notice(st){
    if(st.ok && st.reason === "granted") return null;
    const div = document.createElement("div");
    div.className = st.ok ? "tip" : "warnbox";
    div.style.margin = "12px 0";
    div.innerHTML = "<b>" + esc(t("mic.title")) + ":</b> " + explain(st);
    return div;
  }

  function esc(s){
    return String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
  }

  /* פתיחת המיקרופון עם דיווח מדויק על הכישלון */
  async function open(onData){
    const st = await status();
    if(!st.ok) return { ok:false, reason:st.reason, message:explain(st) };
    const started = await Tuner.start(onData, () => {});
    if(started) return { ok:true, reason:"granted" };
    /* getUserMedia נכשל למרות שהמצב נראה תקין – בדרך כלל סירוב בחלון הבקשה */
    const after = await permission();
    const reason = after === "denied" ? "denied" : "nodevice";
    return { ok:false, reason, message: reason === "denied" ? t("mic.denied") : t("mic.nodevice") };
  }

  return { status, explain, notice, open, secure, supported, permission };
})();
