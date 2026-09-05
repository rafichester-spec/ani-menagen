/* ==========================================================================
   data-core.js – נתוני יסוד: כלים, אקורדים, שירים (נחלת הכלל), תגים, מנויים
   כל התכנים כאן הם יצירות מקוריות של האפליקציה או יצירות שהן נחלת הכלל.
   ========================================================================== */

const APP = {
  name: "אני מנגן",
  version: "2.6.0",
  freeLessons: 3,          // מספר השיעורים החינמיים בכל כלי
  dailyGoalDefault: 10,    // דקות תרגול ליום
  contact: {
    name: "עו״ד רפאל צ׳סטר",
    phone: "054-550-2848",
    tel: "0545502848",
    email: "rafichester@gmail.com"
  }
};

/* ---------- כלי נגינה ---------- */
const INSTRUMENTS = [
  { id:"piano",    name:"פסנתר / קלידים", emoji:"🎹", tag:"הכי קל להתחיל",
    blurb:"רואים את כל התווים מול העיניים. הכלי המומלץ למתחילים מוחלטים ולכל מי שרוצה להבין מוזיקה.",
    tune:"", timbre:"piano" },
  { id:"guitar",   name:"גיטרה", emoji:"🎸", tag:"3 אקורדים = מאות שירים",
    blurb:"תוך שלושה שיעורים כבר מלווים שירה. אקורדים פתוחים, מקצבי ליווי וטכניקת יד ימין.",
    tune:"E2 A2 D3 G3 B3 E4", timbre:"guitar" },
  { id:"ukulele",  name:"אוקולילה", emoji:"🪕", tag:"הכי מהיר לשיר ראשון",
    blurb:"ארבעה מיתרים רכים, אקורדים באצבע אחת. השיר הראשון מגיע כבר בשיעור הראשון.",
    tune:"G4 C4 E4 A4", timbre:"uke" },
  { id:"recorder", name:"חלילית", emoji:"🎶", tag:"מושלם לילדים",
    blurb:"כלי הנשיפה הקלאסי של בית הספר – נשימה, אצבוע ותווים ראשונים בלי צורך בכוח או בגודל יד.",
    tune:"", timbre:"flute" },
  { id:"drums",    name:"תופים והקשה", emoji:"🥁", tag:"בלי תווים – רק גרוב",
    blurb:"קצב הוא הבסיס של כל מוזיקה. לומדים גרוּב, ספירה, פילים – גם על שולחן או על כריות.",
    tune:"", timbre:"drum" },
  { id:"bass",     name:"גיטרה בס", emoji:"🎻", tag:"הכלי המבוקש בהרכבים",
    blurb:"נגן אחד עם ארבעה מיתרים שמחזיק את כל הלהקה. קל להתחיל, קשה להפסיק.",
    tune:"E1 A1 D2 G2", timbre:"bass" }
];
const INST = Object.fromEntries(INSTRUMENTS.map(i => [i.id, i]));

/* ---------- מוזיקה: תווים ותדרים ---------- */
const NOTE_ORDER = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const NOTE_HE = { "C":"דו","C#":"דו#","D":"רה","D#":"רה#","E":"מי","F":"פה","F#":"פה#","G":"סול","G#":"סול#","A":"לה","A#":"לה#","B":"סי" };

/* נרמול שם תו: מקבל A#4, A4#, Bb4, B4b ומחזיר תמיד את הצורה התקנית A#4 */
const FLAT_TO_SHARP = { "Cb":"B", "Db":"C#", "Eb":"D#", "Fb":"E", "Gb":"F#", "Ab":"G#", "Bb":"A#" };
function normNote(note){
  if(!note) return null;
  const m = /^([A-G])(#|b)?(-?\d)(#|b)?$/.exec(String(note).trim());
  if(!m) return null;
  let letter = m[1], acc = m[2] || m[4] || "", oct = parseInt(m[3], 10);
  if(acc === "b"){
    const conv = FLAT_TO_SHARP[letter + "b"];
    if(conv === "B" && letter === "C") oct -= 1;   // Cb4 = B3
    letter = conv.charAt(0); acc = conv.slice(1);
  }
  return letter + acc + oct;
}
function noteToFreq(note){
  const n = normNote(note);
  if(!n) return 440;
  const m = /^([A-G]#?)(-?\d)$/.exec(n);
  const semis = NOTE_ORDER.indexOf(m[1]) + (parseInt(m[2],10) + 1) * 12; // C-1 = 0
  return 440 * Math.pow(2, (semis - 69) / 12);
}
/* שם התו בשפת הממשק.
   NOTE_HE נשאר כרשת ביטחון לעברית, אבל בשאר השפות השם מגיע מחבילת השפה:
   סולפז' (דו־רה־מי) בצרפתית, ספרדית, איטלקית, רוסית וערבית — ואותיות
   באנגלית, גרמנית ואמהרית, שם זו הצורה המקובלת בהוראה. */
function noteName(note){
  const n = normNote(note);
  if(!n) return note;
  const pc = /^([A-G]#?)/.exec(n)[1];
  const base = pc.charAt(0);
  const key = "note." + base;
  const local = (typeof I18N !== "undefined" && I18N.has(key)) ? I18N.t(key) : NOTE_HE[base];
  return local + (pc.length > 1 ? "#" : "");
}

/* תצוגה מלאה: מוסיפה את הכתיב הלטיני רק כשהוא באמת מוסיף מידע.
   בעברית → "דו C4"; באנגלית → "C4" בלבד, במקום "C C4" מיותר. */
function noteLabel(note){
  const n = normNote(note);
  if(!n) return note;
  const pc = /^([A-G]#?)/.exec(n)[1];
  const local = noteName(n);
  return local === pc ? n : local + " " + n;
}

const noteHe = noteName;   /* תאימות לאחור */

/* ---------- צבע קבוע לכל תו ----------
   המוסכמה המקובלת בהוראת מוזיקה (Boomwhackers / Chroma-Notes): דו אדום,
   ומשם סביב גלגל הצבעים. אותו תו = אותו צבע בכל אוקטבה ובכל מסך.
   הצבע הוא תמיד *תוספת* לשם התו ולעולם לא תחליף לו — תקן 5568 ו-WCAG 1.4.1
   אוסרים על צבע כנשא המידע היחיד. fg הוא צבע הטקסט שעובר ניגודיות AA
   מעל אותו רקע (נבדק חישובית, ראו noteContrast). */
const NOTE_COLORS = {
  "C":  { bg:"#d92b2b", fg:"#ffffff" },
  "C#": { bg:"#e2622a", fg:"#1a1200" },
  "D":  { bg:"#ef8a17", fg:"#1a1200" },
  "D#": { bg:"#f0b30f", fg:"#1a1200" },
  "E":  { bg:"#efe024", fg:"#1a1200" },
  "F":  { bg:"#a8cf2c", fg:"#1a1200" },
  "F#": { bg:"#3aa64c", fg:"#1a1200" },
  "G":  { bg:"#159c98", fg:"#1a1200" },
  "G#": { bg:"#2975c5", fg:"#ffffff" },
  "A":  { bg:"#5f47bd", fg:"#ffffff" },
  "A#": { bg:"#9a3fae", fg:"#ffffff" },
  "B":  { bg:"#d84797", fg:"#1a1200" }
};

/* מחלקת ה-CSS של התו: nc-C, nc-Cs וכו' (# אינו חוקי בשם מחלקה) */
function noteColorClass(note){
  const n = normNote(note);
  if(!n) return "";
  const pc = /^([A-G]#?)/.exec(n)[1];
  return "nc-" + pc.replace("#", "s");
}
function noteColor(note){
  const n = normNote(note);
  if(!n) return null;
  return NOTE_COLORS[/^([A-G]#?)/.exec(n)[1]] || null;
}

/* ---------- אקורדים (דיאגרמות מקוריות; ידע מוזיקלי בסיסי אינו מוגן בזכויות יוצרים) ---------- */
/* מערך אצבועים: מהמיתר העבה לדק. -1 = מיתר מושתק, 0 = פתוח */
const CHORDS = {
  guitar: [
    { id:"Em", name:"Em (מי מינור)", frets:[0,2,2,0,0,0],  fingers:[0,2,3,0,0,0], notes:["E2","B2","E3","G3","B3","E4"], level:1, tip:"האקורד הקל בעולם – שתי אצבעות בלבד." },
    { id:"Am", name:"Am (לה מינור)", frets:[-1,0,2,2,1,0], fingers:[0,0,2,3,1,0], notes:["A2","E3","A3","C4","E4"],      level:1, tip:"אותה צורה כמו Em, מוזזת מיתר אחד." },
    { id:"C",  name:"C (דו מז'ור)",  frets:[-1,3,2,0,1,0], fingers:[0,3,2,0,1,0], notes:["C3","E3","G3","C4","E4"],      level:1, tip:"שמור על אצבע מכופפת כדי לא לחנוק את המיתר הפתוח." },
    { id:"G",  name:"G (סול מז'ור)", frets:[3,2,0,0,0,3],  fingers:[2,1,0,0,0,3], notes:["G2","B2","D3","G3","B3","G4"], level:2, tip:"אצבע 3 על מיתר 1 – מכינה מעבר מהיר ל-C." },
    { id:"D",  name:"D (רה מז'ור)",  frets:[-1,-1,0,2,3,2],fingers:[0,0,0,1,3,2], notes:["D3","A3","D4","F#4"],          level:2, tip:"משולש קטן – מנגנים רק ארבעה מיתרים." },
    { id:"A",  name:"A (לה מז'ור)",  frets:[-1,0,2,2,2,0], fingers:[0,0,1,2,3,0], notes:["A2","E3","A3","C#4","E4"],     level:2, tip:"שלוש אצבעות בשורה אחת – צריך מקום, נסה לכווץ." },
    { id:"Dm", name:"Dm (רה מינור)", frets:[-1,-1,0,2,3,1],fingers:[0,0,0,2,3,1], notes:["D3","A3","D4","F4"],           level:2, tip:"אקורד עצוב ויפה, נהדר לבלדות." },
    { id:"E",  name:"E (מי מז'ור)",  frets:[0,2,2,1,0,0],  fingers:[0,2,3,1,0,0], notes:["E2","B2","E3","G#3","B3","E4"],level:2, tip:"Em עם אצבע אחת נוספת." }
  ],
  ukulele: [
    { id:"C",  name:"C (דו מז'ור)",  frets:[0,0,0,3], fingers:[0,0,0,3], notes:["G4","C4","E4","C5"], level:1, tip:"אצבע אחת – האקורד הראשון של כולם." },
    { id:"Am", name:"Am (לה מינור)", frets:[2,0,0,0], fingers:[2,0,0,0], notes:["A4","C4","E4","A4"], level:1, tip:"גם כאן אצבע אחת בלבד." },
    { id:"F",  name:"F (פה מז'ור)",  frets:[2,0,1,0], fingers:[2,0,1,0], notes:["A4","C4","F4","A4"], level:1, tip:"שתי אצבעות. עם C ו-Am כבר יש לך שיר." },
    { id:"G",  name:"G (סול מז'ור)", frets:[0,2,3,2], fingers:[0,1,3,2], notes:["G4","D4","G4","B4"], level:2, tip:"משולש – שים לב שהאצבעות עומדות על הקצה." },
    { id:"Em", name:"Em (מי מינור)", frets:[0,4,3,2], fingers:[0,3,2,1], notes:["G4","E4","G4","B4"], level:2, tip:"אלכסון יורד – תרגל לאט." },
    { id:"Dm", name:"Dm (רה מינור)", frets:[2,2,1,0], fingers:[2,3,1,0], notes:["A4","D4","F4","A4"], level:2, tip:"כמו F עם אצבע נוספת." }
  ]
};

/* ---------- תגי הישג ---------- */
const BADGES = [
  { id:"first",     ico:"🌱", name:"הצעד הראשון",       desc:"סיימת את השיעור הראשון שלך" },
  { id:"three",     ico:"🔥", name:"שלושה ברצף",        desc:"סיימת 3 שיעורים" },
  { id:"ten",       ico:"🏅", name:"עשרת המובחרים",     desc:"סיימת 10 שיעורים" },
  { id:"streak3",   ico:"📅", name:"רצף של 3 ימים",     desc:"תרגלת 3 ימים ברציפות" },
  { id:"streak7",   ico:"🗓️", name:"שבוע מלא",          desc:"תרגלת 7 ימים ברציפות" },
  { id:"multi",     ico:"🎼", name:"רב-כליים",          desc:"התחלת ללמוד שני כלים שונים" },
  { id:"ear",       ico:"👂", name:"אוזן מוזיקלית",     desc:"10 תשובות נכונות באימון אוזן" },
  { id:"metro",     ico:"⏱️", name:"בקצב",              desc:"תרגלת 5 דקות עם מטרונום" },
  { id:"song",      ico:"🎵", name:"השיר הראשון",       desc:"ניגנת שיר שלם מספריית השירים" },
  { id:"hour",      ico:"⌛", name:"שעת תרגול",         desc:"צברת 60 דקות תרגול" },
  { id:"quizace",   ico:"🎯", name:"קלעת בול",          desc:"5 תשובות נכונות ברצף בשאלוני שיעור" },
  { id:"level5",    ico:"⭐", name:"דרגה 5",            desc:"הגעת לדרגה 5" },
  { id:"rep1",      ico:"🎼", name:"שיר ראשון ברפרטואר", desc:"סימנת שיר ראשון שאתה יודע לנגן" },
  { id:"rep5",      ico:"📀", name:"חמישה שירים",        desc:"5 שירים ברפרטואר האישי שלך" },
  { id:"rep10",     ico:"💿", name:"מסיבה שלמה",         desc:"10 שירים – מספיק לערב שלם" },
  { id:"rep25",     ico:"🎧", name:"רפרטואר רציני",      desc:"25 שירים ברפרטואר" },
  { id:"rep50",     ico:"👑", name:"חמישים שירים",       desc:"50 שירים ברפרטואר – רמת נגן מנוסה" },
  { id:"virtuoso",  ico:"🎹", name:"וירטואוז",           desc:"שלטת בקטע מדרגה 5" },
  { id:"recital",   ico:"🏆", name:"רסיטל סיום",         desc:"עברת רסיטל סיום וקיבלת תעודה" },
  { id:"maestro",   ico:"🎖️", name:"מאסטרו",             desc:"תעודות סיום בשלושה כלים שונים" },
  { id:"coach90",   ico:"🎤", name:"אוזן וידיים",         desc:"90% דיוק ומעלה במאמן הנגינה" },
  { id:"fast60",    ico:"⚡", name:"ידיים מהירות",        desc:"60 מעברי אקורדים בדקה" }
];

/* ---------- מסלולי מנוי (סליקה להדגמה בלבד) ---------- */
const PLANS = [
  { id:"monthly", name:"חודשי",  price:39,  per:"לחודש", best:false,
    perks:["גישה מלאה לכל השיעורים בכל הכלים","כל כלי האימון","ספריית השירים המלאה","ביטול בכל עת"] },
  { id:"yearly",  name:"שנתי",   price:290, per:"לשנה", best:true, note:"חיסכון של 39%",
    perks:["כל מה שבמסלול החודשי","שיעורים חדשים מדי חודש","דוח התקדמות להורים / למורה","תמיכה בדוא״ל"] },
  { id:"life",    name:"לכל החיים", price:690, per:"תשלום חד-פעמי", best:false,
    perks:["גישה לכל התכנים – לתמיד","כל התכנים העתידיים כלולים","עד 3 פרופילים במשפחה","ללא חידוש וללא הפתעות"] }
];

const COUPONS = { "NAGEN2026": 25, "MUSIC50": 50, "FRIEND10": 10 };
