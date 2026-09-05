/* ==========================================================================
   legal.js – עמודי מסמכים משפטיים (נגישות, פרטיות, תנאי שימוש, מקורות)
   התוכן עצמו מגיע מחבילות השפה (js/lang/legal-<code>.js).
   ========================================================================== */

const Legal = (() => {
  const C = APP.contact;

  function contactBlock(){
    return `<div class="card">
      <h3>${t("legal.contactH")}</h3>
      <p><b>${t("contact.name")}</b><br>
      ${t("foot.phone")}: <a href="tel:${C.tel}" dir="ltr">${C.phone}</a><br>
      ${t("foot.email")}: <a href="mailto:${C.email}" dir="ltr">${C.email}</a></p>
      <p class="muted">${t("legal.contactHours")}</p>
    </div>`;
  }

  function fill(html){
    return String(html)
      .split("{contact}").join(contactBlock())
      .split("{name}").join(t("contact.name"))
      .split("{n}").join(SONGS.length);
  }

  function page(titleKey, bodyHtml){
    const note = (I18N.lang() !== "he" && I18N.lang() !== "en" && t("legal.langNote"))
      ? `<div class="tip">${t("legal.langNote")}</div>` : "";
    return `<section class="section"><div class="wrap doc">
      <h1>${t(titleKey)}</h1>
      <p class="muted">${t("legal.updated", { date: t("legal.updatedDate") })}</p>
      ${note}${bodyHtml}
    </div></section>`;
  }

  function accessibility(main){ main.innerHTML = page("legal.a11y.title",    fill(t("legal.a11y.body"))); }
  function privacy(main){       main.innerHTML = page("legal.privacy.title", fill(t("legal.privacy.body"))); }
  function terms(main){         main.innerHTML = page("legal.terms.title",   fill(t("legal.terms.body"))); }

  function credits(main){
    const rows = SONGS.map(s =>
      `<tr><td>${UI.esc(I18N.songTitle(s))}</td><td>${UI.esc(I18N.songSrc(s))}</td></tr>`).join("");
    const table = `<table><tr><th>${t("legal.credits.tableWork")}</th><th>${t("legal.credits.tableSrc")}</th></tr>${rows}</table>`;
    main.innerHTML = page("legal.credits.title",
      fill(t("legal.credits.intro")) + table + fill(t("legal.credits.rest")) + contactBlock());
  }

  return { accessibility, privacy, terms, credits };
})();
