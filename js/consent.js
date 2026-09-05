/* ==========================================================================
   consent.js – הודעת אחסון והסכמה
   --------------------------------------------------------------------------
   האפליקציה אינה משתמשת בקובצי Cookie כלל, ולכן אין כאן "באנר קוקיז".
   הודעה שמדברת על קוקיז כשאין קוקיז היא הצהרה לא נכונה למשתמש ולרגולטור.
   מה שכן קיים: אחסון מקומי (localStorage / IndexedDB) שמחזיק את ההתקדמות
   של המשתמש במכשיר שלו בלבד. זה אחסון תפקודי — הוא הכרחי לשירות שהמשתמש
   ביקש — ולכן הדרישה המרכזית היא שקיפות, והיא מה שהמסך הזה נותן.
   ========================================================================== */

const Consent = (() => {

  function needed(){
    return !Store.state.consent;
  }

  function accept(){
    Store.state.consent = { at: new Date().toISOString(), version: APP.version };
    Store.save();
    const b = document.getElementById("consentBar");
    if(b) b.remove();
    document.body.classList.remove("has-consent-bar");
  }

  function show(){
    if(!needed()) return;
    const bar = document.createElement("div");
    bar.id = "consentBar";
    bar.className = "consent-bar";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-modal", "false");
    bar.setAttribute("aria-labelledby", "consentTitle");
    bar.innerHTML = `
      <div class="consent-inner">
        <div>
          <b id="consentTitle">${UI.esc(t("consent.title"))}</b>
          <p>${t("consent.body")}</p>
          <p class="muted consent-detail">${t("consent.detail")}</p>
        </div>
        <div class="consent-actions">
          <button class="btn" id="consentOk">${UI.esc(t("consent.ok"))}</button>
          <a class="btn btn-ghost btn-sm" href="#/legal/privacy">${UI.esc(t("legal.privacy.title"))}</a>
        </div>
      </div>`;
    document.body.appendChild(bar);
    document.body.classList.add("has-consent-bar");
    const ok = bar.querySelector("#consentOk");
    ok.addEventListener("click", accept);
    ok.focus();
    /* Escape סוגר בלי לאשר – ההודעה תחזור בכניסה הבאה */
    bar.addEventListener("keydown", e => {
      if(e.key === "Escape"){ bar.remove(); document.body.classList.remove("has-consent-bar"); }
    });
  }

  return { show, accept, needed };
})();
