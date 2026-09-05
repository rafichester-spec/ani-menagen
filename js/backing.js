/* ==========================================================================
   backing.js – מנוע ליווי אוטומטי
   מפרק סמל אקורד לתווים, ומנגן אותו בלולאה יחד עם תבנית תופים.
   הכול מסונתז בזמן אמת – אין קובצי אודיו ואין לופים מוקלטים.
   ========================================================================== */

const Backing = (() => {

  /* ---------------- פירוק סמל אקורד לתווים ---------------- */
  const QUALITY = {
    "":      [0, 4, 7],          // מז'ור
    "m":     [0, 3, 7],          // מינור
    "5":     [0, 7, 12],         // אקורד כוח
    "7":     [0, 4, 7, 10],      // דומיננטי
    "m7":    [0, 3, 7, 10],
    "maj7":  [0, 4, 7, 11],
    "dim":   [0, 3, 6],
    "aug":   [0, 4, 8],
    "sus4":  [0, 5, 7],
    "sus2":  [0, 2, 7],
    "6":     [0, 4, 7, 9],
    "m6":    [0, 3, 7, 9],
    "9":     [0, 4, 7, 10, 14]
  };
  const SEMI = { C:0, "C#":1, Db:1, D:2, "D#":3, Eb:3, E:4, F:5, "F#":6, Gb:6,
                 G:7, "G#":8, Ab:8, A:9, "A#":10, Bb:10, B:11 };

  /* "Am7" → { root:9, quality:"m7" } */
  function parseChord(sym){
    const m = /^([A-G][#b]?)(.*)$/.exec(String(sym).trim());
    if(!m) return null;
    const root = SEMI[m[1]];
    if(root === undefined) return null;
    let q = (m[2] || "").trim();
    if(q === "M" || q === "maj") q = "";
    if(q === "min" || q === "-") q = "m";
    if(!(q in QUALITY)) q = q.startsWith("m") && !q.startsWith("maj") ? "m" : "";
    return { root, quality: q, symbol: sym };
  }

  /* מחזיר מערך שמות תווים לאקורד, בטווח נוח לליווי */
  function chordNotes(sym, baseOct){
    const c = parseChord(sym);
    if(!c) return [];
    const oct = baseOct || 3;
    return QUALITY[c.quality].map(iv => {
      const abs = c.root + iv + (oct + 1) * 12;
      return NOTE_ORDER[abs % 12] + (Math.floor(abs / 12) - 1);
    });
  }
  function bassNote(sym, oct){
    const c = parseChord(sym);
    if(!c) return null;
    const abs = c.root + ((oct || 2) + 1) * 12;
    return NOTE_ORDER[abs % 12] + (Math.floor(abs / 12) - 1);
  }

  /* ---------------- תבניות ליווי ---------------- */
  /* כל תבנית מתוארת ב-8 שמיניות בתיבה.
     ch = נגינת אקורד, b = בס, k/s/h = בס-דרם/סנר/היי-האט */
  const STYLES = {
    pop:    { ch:[1,0,0,1,1,0,0,1], b:[1,0,0,0,1,0,0,0], k:[1,0,0,1,0,0,1,0], s:[0,0,1,0,0,0,1,0], h:[1,1,1,1,1,1,1,1] },
    rock:   { ch:[1,0,1,0,1,0,1,0], b:[1,0,0,0,1,0,0,0], k:[1,0,0,0,1,0,0,1], s:[0,0,1,0,0,0,1,0], h:[1,1,1,1,1,1,1,1] },
    ballad: { ch:[1,0,0,0,0,0,0,0], b:[1,0,0,0,1,0,0,0], k:[1,0,0,0,0,0,0,0], s:[0,0,0,0,1,0,0,0], h:[0,0,0,0,0,0,0,0], arp:true },
    latin:  { ch:[1,0,1,1,0,1,1,0], b:[1,0,0,1,0,1,0,0], k:[1,0,0,1,0,0,1,0], s:[0,0,0,0,1,0,0,0], h:[1,0,1,1,0,1,1,0] },
    chords: { ch:[1,0,0,0,1,0,0,0], b:[1,0,0,0,0,0,0,0], k:[0,0,0,0,0,0,0,0], s:[0,0,0,0,0,0,0,0], h:[0,0,0,0,0,0,0,0] }
  };
  const STYLE_IDS = ["pop","rock","ballad","latin","chords"];

  /* ---------------- מנוע הנגינה ---------------- */
  let timer = null, step = 0, prog = [], style = "pop", bpm = 90;
  let onTick = null, countIn = 0, running = false, volume = .8;

  function chordsFrom(song){
    if(!song || !song.chords) return [];
    return song.chords.trim().split(/\s+/).filter(Boolean);
  }

  function start(opts){
    stop();
    prog  = (opts.chords && opts.chords.length) ? opts.chords : [];
    if(!prog.length) return false;
    style = STYLES[opts.style] ? opts.style : "pop";
    bpm   = Math.max(40, Math.min(200, opts.bpm || 90));
    onTick = opts.onTick || null;
    volume = opts.volume === undefined ? .8 : opts.volume;
    countIn = opts.countIn ? 8 : 0;     // תיבת ספירה אחת = 8 שמיניות
    step = 0; running = true;
    Audio1.ensure();
    tick();
    timer = setInterval(tick, 30000 / bpm);   // שמינית
    return true;
  }

  function tick(){
    const p = STYLES[style];

    if(countIn > 0){
      if(countIn % 2 === 0) Audio1.click(countIn === 8);
      if(onTick) onTick({ countIn: Math.ceil(countIn / 2), bar: -1, beat: 0, chord: prog[0] });
      countIn--;
      return;
    }

    const i = step % 8;
    const bar = Math.floor(step / 8) % prog.length;
    const chord = prog[bar];
    const notes = chordNotes(chord, 3);

    if(p.ch[i] && notes.length){
      if(p.arp){
        const n = notes[(Math.floor(step / 2)) % notes.length];
        Audio1.playNote(n, 1.6, "guitar", .22 * volume);
      }else{
        notes.forEach((n, k) => setTimeout(() =>
          Audio1.playNote(n, 1.1, "guitar", .17 * volume), k * 14));
      }
    }
    if(p.b[i]){
      const bn = bassNote(chord, 2);
      if(bn) Audio1.playNote(bn, .9, "bass", .34 * volume);
    }
    if(p.k[i]) Audio1.drum("kick",  .8 * volume);
    if(p.s[i]) Audio1.drum("snare", .55 * volume);
    if(p.h[i]) Audio1.drum("hihat", .3 * volume);

    if(onTick) onTick({ countIn: 0, bar, beat: Math.floor(i / 2), chord, step: i });
    step++;
  }

  function stop(){
    if(timer) clearInterval(timer);
    timer = null; running = false; step = 0; countIn = 0;
  }
  function isRunning(){ return running; }
  function setVolume(v){ volume = v; }

  return { start, stop, isRunning, setVolume, chordNotes, bassNote,
           parseChord, chordsFrom, STYLE_IDS };
})();
