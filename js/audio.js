/* ==========================================================================
   audio.js – מנוע צליל מקורי מבוסס Web Audio API
   כל הצלילים מיוצרים בזמן אמת (סינתזה). אין באפליקציה קובצי אודיו כלל,
   ולכן אין כל שימוש בהקלטות או בדגימות המוגנות בזכויות יוצרים.
   ========================================================================== */

const Audio1 = (() => {
  let ctx = null, master = null, limiter = null, unlocked = false;
  let muted = false;

  function ensure(){
    if(!ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = .8;
      /* מגביל רך לפני היציאה.
         שישה מיתרים שנפרטים יחד מגיעים לשיא 1.41 — כלומר חיתוך ועיוות נשמע.
         הסף נמוך מספיק כדי לתפוס ערימות כאלה, וגבוה מספיק כדי לא לגעת בתו בודד. */
      limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -3;
      limiter.knee.value = 3;
      limiter.ratio.value = 20;
      limiter.attack.value = .002;
      limiter.release.value = .15;
      master.connect(limiter);
      limiter.connect(ctx.destination);
    }
    if(ctx.state === "suspended") ctx.resume();
    unlocked = true;
    return ctx;
  }

  /* פרופילי צליל לכל כלי */
  const TIMBRES = {
    piano:  { waves:[["triangle",1],["sine",.45]], attack:.005, decay:2.2, cut:4200, q:.7 },
    guitar: { waves:[["sawtooth",.55],["triangle",.5]], attack:.004, decay:1.9, cut:2600, q:1.2 },
    uke:    { waves:[["triangle",.8],["square",.18]], attack:.003, decay:1.2, cut:3400, q:1 },
    flute:  { waves:[["sine",1],["triangle",.12]], attack:.05, decay:1.1, cut:5000, q:.6, vib:5 },
    bass:   { waves:[["sine",1],["triangle",.4]], attack:.008, decay:1.6, cut:900, q:1.4 },
    synth:  { waves:[["sawtooth",.6],["square",.25]], attack:.01, decay:1.1, cut:2200, q:1 }
  };

  /* ==========================================================================
     מיתר פרוט – מודל פיזי (Karplus-Strong עם השהיה שברית)
     --------------------------------------------------------------------------
     אוסילטורים מרובעים/משוננים לא נשמעים כמו גיטרה, כי במיתר אמיתי כל הרמוניה
     דועכת בקצב אחר: הגבוהות נעלמות ראשונות והצליל "מתחמם" תוך כדי. במקום לחקות
     את זה בפילטרים, המנוע הזה מדמה את המיתר עצמו — פרץ רעש (הפריטה) שמסתובב
     בקו השהיה באורך של תקופה אחת, ובכל סיבוב עובר סינון קל.

     שלושה דיוקים שחשובים דווקא כאן:
       • השהיה שברית — אורך המאגר כמעט אף פעם אינו מספר שלם של דגימות. עיגול
         גורם לסטייה של עד כ-5 סנט, וזה קריטי באפליקציה שמלמדת גובה צליל ומודדת
         סנטים במכוון. אינטרפולציה לינארית מחזירה את הסטייה לפחות מסנט אחד.
       • מסנן מיקום פריטה — פריטה במרחק p מהגשר מבטלת הרמוניות בכפולות של 1/p.
         זה מה שנותן לגיטרה את הצבע שלה, ולא סתם "יותר בס".
       • תיבת תהודה — גוף הגיטרה מגביר סביב תהודת הלמהולץ (כ-100 הרץ) ותהודת
         הלוח (כ-200 הרץ). בלי זה הצליל דק ו"אלקטרוני".
     ========================================================================== */
  const PLUCK = {
    /* sustain = שניות עד דעיכה של 60dB · tone = בהירות הפריטה · damp = ריכוך
       ההרמוניות הגבוהות בכל סיבוב · pick = מיקום הפריטה (חלק מאורך המיתר) */
    guitar: { sustain:4.5, tone:.55, damp:.52, pick:.18, noise:.35, body:[[100,1.6,5],[200,2.2,3.5],[2400,.9,2]], hp:70,  gain:1 },
    uke:    { sustain:2.2, tone:.70, damp:.44, pick:.22, noise:.30, body:[[380,1.8,4],[900,1.4,2.5]],              hp:180, gain:.95 },
    bass:   { sustain:5.5, tone:.32, damp:.62, pick:.12, noise:.20, body:[[60,1.4,4],[120,1.8,2]],                 hp:35,  gain:1.1 }
  };

  /* מאגר צלילים מחושבים – מונע חישוב חוזר של אותו תו */
  const pluckCache = new Map();
  const CACHE_MAX = 240;

  function ksRender(freq, dur, p){
    const sr = ctx.sampleRate;
    const n = Math.ceil(sr * dur);
    /* אורך ההשהיה, פחות ההשהיה שמסנן הריכוך מוסיף בעצמו.
       למסנן חד-קוטבי y=a·x+(1-a)·y⁻¹ ההשהיה היא (1-a)/a דגימות — לא חצי דגימה.
       בלי התיקון הזה הצליל נמוך בעד 7 סנט, וזה פוסל אותו כצליל ייחוס למכוון. */
    const D = Math.max(2, sr / freq - (1 - p.damp) / p.damp);
    const N = Math.floor(D), frac = D - N;
    const out = new Float32Array(n);

    /* צורת הפריטה.
       רעש לבן לבדו (Karplus-Strong הקלאסי) מחלק את האנרגיה אקראית בין
       ההרמוניות, ולכן היסוד יוצא חלש באקראי והצליל נשמע דק ומתכתי.
       התנאי ההתחלתי האמיתי של מיתר פרוט הוא משולש שקודקודו בנקודת הפריטה —
       ומשולש כזה נותן אמפליטודות של sin(nπp)/n², כלומר יסוד חזק ודעיכה טבעית
       של ההרמוניות. מוסיפים אליו מעט רעש, שנותן לנגיעה את הרעש של הציפורן. */
    const exN = Math.min(N, n - 1);
    let lp = 0;
    for(let i = 0; i <= exN; i++){
      const x = i / N;
      const tri = x < p.pick ? x / p.pick : (1 - x) / (1 - p.pick);
      lp += ((Math.random() * 2 - 1) - lp) * p.tone;
      out[i] = tri * (1 - p.noise) + lp * p.noise;
    }
    /* איפוס רכיב DC ונרמול */
    let sum = 0, mx = 0;
    for(let i = 0; i <= exN; i++) sum += out[i];
    const mean = sum / (exN + 1);
    for(let i = 0; i <= exN; i++){ out[i] -= mean; mx = Math.max(mx, Math.abs(out[i])); }
    if(mx > 0) for(let i = 0; i <= exN; i++) out[i] /= mx;

    /* לולאת המיתר.
       דגימה נכתבת פעם אחת ונקראת פעם אחת בכל סיבוב, ולכן הכפל ב-g מתרחש פעם
       בסיבוב — כלומר freq פעמים בשנייה, ולא sr פעמים. חישוב לפי דגימות נותן
       מיתר שכמעט אינו דועך.
       ומיתר עבה מצלצל יותר מדק, ולכן זמן הדעיכה תלוי בתדר. */
    const sus = p.sustain * Math.pow(110 / freq, .4);
    /* מסנן הריכוך מחליש גם את היסוד עצמו, ובתדרים גבוהים ההחלשה הזו מצטברת
       על פני מאות סיבובים ומחסלת את הצליל. מחשבים את |H| ביסוד ומקזזים אותו,
       כך שזמן הדעיכה נשמר בכל גובה — וההרמוניות, שמוחלשות יותר, עדיין דועכות
       מהר יותר מהיסוד, בדיוק כמו במיתר אמיתי. */
    const w = 2 * Math.PI * freq / sr, a = p.damp, b1 = 1 - a;
    const hMag = a / Math.hypot(1 - b1 * Math.cos(w), b1 * Math.sin(w));
    /* חסם ביטחון: הגבר לולאה מעל 1 עלול להתפוצץ, ולכן מגבילים אותו.
       בתדרים גבוהים הדעיכה תהיה מעט מהירה מהיעד — וזה גם ההתנהגות האמיתית. */
    const g = Math.min(.99995, Math.pow(10, -3 / (freq * sus)) / hMag);
    let prev = 0;
    for(let i = exN + 1; i < n; i++){
      const a = out[i - N], b = out[i - N - 1] || 0;
      let v = a * (1 - frac) + b * frac;             // השהיה שברית
      prev = prev + (v - prev) * p.damp;             // ריכוך ההרמוניות הגבוהות
      out[i] = prev * g;
      prev = out[i];
    }
    /* דעיכה רכה בסוף, שלא ייקטע באמצע גל */
    const tail = Math.min(n, Math.round(sr * .06));
    for(let i = 0; i < tail; i++) out[n - 1 - i] *= i / tail;
    return out;
  }

  function pluckBuffer(freq, dur, name, p){
    const key = name + "|" + freq.toFixed(2) + "|" + dur.toFixed(2);
    let buf = pluckCache.get(key);
    if(buf) return buf;
    buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    buf.getChannelData(0).set(ksRender(freq, dur, p));
    if(pluckCache.size >= CACHE_MAX) pluckCache.delete(pluckCache.keys().next().value);
    pluckCache.set(key, buf);
    return buf;
  }

  function pluck(freq, dur, name, vol){
    const c = ensure(); if(!c) return;
    const p = PLUCK[name];
    /* הצליל ממשיך לצלצל אחרי אורך התו, כמו במיתר אמיתי */
    const ring = Math.min(3.6, Math.max(dur, .35) + 1.4);
    const src = c.createBufferSource();
    src.buffer = pluckBuffer(freq, ring, name, p);

    let node = src;
    const hp = c.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = p.hp; hp.Q.value = .7;
    node.connect(hp); node = hp;
    p.body.forEach(([f, q, gdb]) => {                // תיבת התהודה
      const bq = c.createBiquadFilter();
      bq.type = "peaking"; bq.frequency.value = f; bq.Q.value = q; bq.gain.value = gdb;
      node.connect(bq); node = bq;
    });

    const g = c.createGain();
    const t0 = c.currentTime;
    g.gain.setValueAtTime(Math.max(.001, vol * p.gain), t0);
    /* השתקה בסוף אורך התו רק אם התו קצר במיוחד – אחרת נותנים למיתר לצלצל */
    node.connect(g); g.connect(master);
    src.start(t0);
    src.stop(t0 + ring + .05);
  }

  /* ניגון תו בודד */
  function note(freq, dur = .6, timbre = "piano", vol = .5){
    if(muted) return;
    const c = ensure(); if(!c) return;
    if(PLUCK[timbre]) return pluck(freq, dur, timbre, vol);   // מיתרים פרוטים – מודל פיזי
    const tb = TIMBRES[timbre] || TIMBRES.piano;
    const t0 = c.currentTime;
    const g = c.createGain();
    const filt = c.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(Math.min(tb.cut, 16000), t0);
    filt.frequency.exponentialRampToValueAtTime(Math.max(tb.cut * .35, 300), t0 + dur);
    filt.Q.value = tb.q;

    const peak = Math.max(.001, vol);
    g.gain.setValueAtTime(.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + tb.attack);
    const rel = Math.max(dur, .12) * (tb.decay > 1.5 ? 1 : 1);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + rel + tb.decay * .35);

    const oscs = tb.waves.map(([type, amt]) => {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      const og = c.createGain();
      og.gain.value = amt;
      o.connect(og); og.connect(filt);
      return o;
    });

    if(tb.vib){ // ויברטו עדין לכלי נשיפה
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = tb.vib; lg.gain.value = freq * .004;
      lfo.connect(lg); oscs.forEach(o => lg.connect(o.frequency));
      lfo.start(t0); lfo.stop(t0 + rel + .6);
    }

    filt.connect(g); g.connect(master);
    const stopAt = t0 + rel + tb.decay * .4;
    oscs.forEach(o => { o.start(t0); o.stop(stopAt); });
  }

  function playNote(name, dur, timbre, vol){ note(noteToFreq(name), dur, timbre, vol); }

  /* ניגון אקורד */
  function chord(names, dur = 1.4, timbre = "piano", strum = 0){
    /* ככל שיש יותר מיתרים כך כל אחד שקט יותר, אחרת השיאים מצטברים ונחתכים */
    const vol = .38 * Math.sqrt(3 / Math.max(3, names.length));
    names.forEach((n, i) => setTimeout(() => playNote(n, dur, timbre, vol), i * strum * 1000));
  }

  /* ---- כלי הקשה מסונתזים ---- */
  function drum(kind, vol = .8){
    if(muted) return;
    const c = ensure(); if(!c) return;
    const t0 = c.currentTime;
    if(kind === "kick"){
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(150, t0);
      o.frequency.exponentialRampToValueAtTime(45, t0 + .13);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(.0001, t0 + .35);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + .4);
      return;
    }
    // רעש לבן לסנר / היי-האט / קראש
    const len = kind === "crash" ? 1.6 : kind === "snare" ? .25 : .07;
    const buf = c.createBuffer(1, c.sampleRate * len, c.sampleRate);
    const d = buf.getChannelData(0);
    for(let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = kind === "hihat" || kind === "crash" ? "highpass" : "bandpass";
    f.frequency.value = kind === "hihat" ? 8000 : kind === "crash" ? 5000 : 1800;
    const g = c.createGain();
    g.gain.setValueAtTime(vol * (kind === "hihat" ? .35 : .7), t0);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + len);
    src.connect(f); f.connect(g); g.connect(master); src.start(t0);
    if(kind === "snare"){
      const o = c.createOscillator(), og = c.createGain();
      o.frequency.setValueAtTime(190, t0); o.type = "triangle";
      og.gain.setValueAtTime(vol * .4, t0);
      og.gain.exponentialRampToValueAtTime(.0001, t0 + .18);
      o.connect(og); og.connect(master); o.start(t0); o.stop(t0 + .2);
    }
    if(kind === "tom"){
      const o = c.createOscillator(), og = c.createGain();
      o.frequency.setValueAtTime(220, t0);
      o.frequency.exponentialRampToValueAtTime(110, t0 + .3);
      og.gain.setValueAtTime(vol * .6, t0);
      og.gain.exponentialRampToValueAtTime(.0001, t0 + .35);
      o.connect(og); og.connect(master); o.start(t0); o.stop(t0 + .4);
    }
  }

  /* ---- צליל ייחוס מתמשך לכיוון באוזן ----
     פריטה דועכת תוך שתיים-שלוש שניות, וזה קצר מדי כדי להשוות אליה מיתר.
     כאן מייצרים צליל יציב עם כמה הרמוניות, שממשיך עד שעוצרים אותו. */
  let drone = null;
  function droneStart(freq){
    droneStop();
    const c = ensure(); if(!c || muted) return null;
    const t0 = c.currentTime;
    const g = c.createGain();
    g.gain.setValueAtTime(.0001, t0);
    g.gain.exponentialRampToValueAtTime(.22, t0 + .08);
    const oscs = [[1, 1], [2, .3], [3, .12], [4, .05]].map(([mult, amt]) => {
      const o = c.createOscillator(), og = c.createGain();
      o.type = mult === 1 ? "triangle" : "sine";
      o.frequency.setValueAtTime(freq * mult, t0);
      og.gain.value = amt;
      o.connect(og); og.connect(g); o.start(t0);
      return o;
    });
    g.connect(master);
    drone = { oscs, g, freq };
    return freq;
  }
  function droneStop(){
    if(!drone) return;
    const c = ctx, t0 = c ? c.currentTime : 0;
    try{
      drone.g.gain.cancelScheduledValues(t0);
      drone.g.gain.setValueAtTime(Math.max(.0001, drone.g.gain.value), t0);
      drone.g.gain.exponentialRampToValueAtTime(.0001, t0 + .12);
      drone.oscs.forEach(o => o.stop(t0 + .15));
    }catch(e){}
    drone = null;
  }
  function droneFreq(){ return drone ? drone.freq : null; }

  function click(strong){
    if(muted) return;
    const c = ensure(); if(!c) return;
    const t0 = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = "square";
    o.frequency.value = strong ? 1600 : 1000;
    g.gain.setValueAtTime(strong ? .32 : .18, t0);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + .05);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + .06);
  }

  /* ---- נגן מנגינות ---- */
  let seqTimers = [], seqPlaying = false;
  function stopSequence(){
    seqTimers.forEach(clearTimeout); seqTimers = []; seqPlaying = false;
    document.dispatchEvent(new CustomEvent("seq:stop"));
  }
  function playSequence(notes, bpm = 90, timbre = "piano", onNote, onEnd){
    stopSequence();
    seqPlaying = true;
    const beat = 60 / bpm;
    let t = 0;
    notes.forEach(([n, len], idx) => {
      const at = t * 1000;
      seqTimers.push(setTimeout(() => {
        if(n) playNote(n, Math.max(.25, len * beat * .95), timbre, .5);
        if(onNote) onNote(n, idx, len * beat);
      }, at));
      t += len * beat;
    });
    seqTimers.push(setTimeout(() => { seqPlaying = false; if(onEnd) onEnd(); }, t * 1000 + 200));
    return t;
  }

  function setMuted(v){ muted = !!v; if(v) stopSequence(); }
  function isMuted(){ return muted; }
  function setVolume(v){ ensure(); if(master) master.gain.value = v; }
  function context(){ return ensure(); }

  /* חשיפה לבדיקות: מחזיר את גל המיתר עצמו, לפני תיבת התהודה */
  function renderPluck(freq, dur, name){ ensure(); return ksRender(freq, dur, PLUCK[name] || PLUCK.guitar); }

  return { ensure, note, playNote, chord, drum, click, playSequence, stopSequence, pluck, renderPluck, droneStart, droneStop, droneFreq,
           setMuted, isMuted, setVolume, context, get playing(){ return seqPlaying; } };
})();

/* ---------- מטרונום ---------- */
const Metronome = (() => {
  let timer = null, bpm = 80, beats = 4, cur = 0, cb = null, running = false;
  function tick(){
    const strong = cur % beats === 0;
    Audio1.click(strong);
    if(navigator.vibrate && document.documentElement.dataset.vibrate === "1")
      navigator.vibrate(strong ? 60 : 25);
    if(cb) cb(cur % beats, strong);
    cur++;
  }
  function start(_bpm, _beats, _cb){
    stop();
    bpm = _bpm || bpm; beats = _beats || beats; cb = _cb || cb; cur = 0; running = true;
    Audio1.ensure();
    tick();
    timer = setInterval(tick, 60000 / bpm);
  }
  function stop(){ if(timer) clearInterval(timer); timer = null; running = false; }
  /* שינוי קצב תוך כדי נגינה – בלי לאפס את התיבה ובלי פעימה מיידית */
  function setBpm(v){
    bpm = v;
    if(running){ clearInterval(timer); timer = setInterval(tick, 60000 / bpm); }
  }
  return { start, stop, setBpm, get running(){ return running; }, get bpm(){ return bpm; } };
})();

/* ---------- מכוון (זיהוי גובה צליל בעזרת אוטוקורלציה) ---------- */
const Tuner = (() => {
  let stream = null, analyser = null, buf = null, raf = null, ctxRef = null;

  function autoCorrelate(buffer, sampleRate){
    const SIZE = buffer.length;
    let rms = 0;
    for(let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / SIZE);
    if(rms < 0.008) return -1;               // שקט
    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for(let i = 0; i < SIZE / 2; i++) if(Math.abs(buffer[i]) < thres){ r1 = i; break; }
    for(let i = 1; i < SIZE / 2; i++) if(Math.abs(buffer[SIZE - i]) < thres){ r2 = SIZE - i; break; }
    const b = buffer.slice(r1, r2), n = b.length;
    const c = new Array(n).fill(0);
    for(let i = 0; i < n; i++) for(let j = 0; j < n - i; j++) c[i] += b[j] * b[j + i];
    let d = 0; while(c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for(let i = d; i < n; i++) if(c[i] > maxval){ maxval = c[i]; maxpos = i; }
    let T0 = maxpos;
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2, bb = (x3 - x1) / 2;
    if(a) T0 = T0 - bb / (2 * a);
    return sampleRate / T0;
  }

  function freqToNote(f){
    const n = Math.round(12 * (Math.log(f / 440) / Math.log(2))) + 69;
    const name = NOTE_ORDER[(n % 12 + 12) % 12];
    const oct = Math.floor(n / 12) - 1;
    const exact = 440 * Math.pow(2, (n - 69) / 12);
    const cents = Math.floor(1200 * Math.log(f / exact) / Math.log(2));
    return { name, oct, cents, label: name + oct };
  }

  async function start(onData, onError){
    try{
      stream = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:false, noiseSuppression:false, autoGainControl:false } });
      ctxRef = Audio1.context();
      const src = ctxRef.createMediaStreamSource(stream);
      analyser = ctxRef.createAnalyser();
      analyser.fftSize = 2048;
      buf = new Float32Array(analyser.fftSize);
      src.connect(analyser);
      const loop = () => {
        analyser.getFloatTimeDomainData(buf);
        const f = autoCorrelate(buf, ctxRef.sampleRate);
        onData(f > 0 ? { freq:f, ...freqToNote(f) } : null);
        raf = requestAnimationFrame(loop);
      };
      loop();
      return true;
    }catch(e){
      if(onError) onError(e);
      return false;
    }
  }
  function stop(){
    if(raf) cancelAnimationFrame(raf); raf = null;
    if(stream){ stream.getTracks().forEach(t => t.stop()); stream = null; }
    analyser = null;
  }
  return { start, stop, freqToNote };
})();
