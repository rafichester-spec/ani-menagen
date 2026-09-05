/* Service Worker – עבודה במצב לא מקוון
   אסטרטגיה: רשת-תחילה עם נפילה למטמון.
   כך המשתמש תמיד מקבל את הגרסה העדכנית כשיש אינטרנט, ועדיין יכול לתרגל בלי חיבור. */
const CACHE = "animenagen-v6";
const ASSETS = [
  "./", "./index.html", "./css/app.css",
  "./js/data-core.js", "./js/data-songs.js", "./js/data-lessons.js",
  "./js/lang/song-src-en.js", "./js/i18n.js", "./js/lang/device-keys.js", "./js/lang/feature-keys.js", "./js/lang/storage-keys.js", "./js/lang/tuner-keys.js", "./js/lang/chord-tips.js", "./js/device.js",
  "./js/lang/ui-he.js", "./js/lang/legal-he.js", "./js/lang/ui-en.js", "./js/lang/legal-en.js", "./js/lang/lessons-en.js", "./js/lang/ui-ar.js", "./js/lang/lessons-ar.js", "./js/lang/ui-ru.js", "./js/lang/lessons-ru.js", "./js/lang/ui-fr.js", "./js/lang/lessons-fr.js", "./js/lang/ui-es.js", "./js/lang/lessons-es.js", "./js/lang/ui-de.js", "./js/lang/lessons-de.js", "./js/lang/ui-pt.js", "./js/lang/lessons-pt.js", "./js/lang/ui-it.js", "./js/lang/lessons-it.js", "./js/lang/ui-am.js", "./js/lang/lessons-am.js",
 "./js/audio.js", "./js/store.js", "./js/storage.js",
  "./js/instruments.js", "./js/views.js", "./js/repertoire.js", "./js/backing.js", "./js/tools.js", "./js/practice.js", "./js/mic.js", "./js/guide.js", "./js/legal.js", "./js/consent.js", "./js/app.js",
  "./manifest.webmanifest", "./icons/icon.svg", "./icons/icon-maskable.svg",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-192.png",
  "./icons/maskable-512.png", "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      /* אם הרשת נפלה וגם אין העתק במטמון, חובה להחזיר תשובה אמיתית.
         החזרת undefined ל-respondWith מפילה את הבקשה ב-ERR_FAILED — וזה מה
         שקרה כשהמטמון נוקה בזמן שהשרת היה כבוי: כל הסקריפטים נכשלו. */
      .catch(() => caches.match(req)
        .then(hit => hit || caches.match("./index.html"))
        .then(hit => hit || new Response(
          "Offline – no cached copy available.",
          { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } })))
  );
});
