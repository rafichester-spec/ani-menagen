/* ==========================================================================
   instruments.js – רכיבים אינטראקטיביים: מקלדת פסנתר, דיאגרמות אקורדים,
   פדים לתופים, ווידג'ט מקצב ונגן מנגינות. הכל נבנה דינמית ב-SVG/DOM.
   ========================================================================== */

const UI = (() => {

  const esc = str => String(str).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const live = msg => { const el = document.getElementById("live"); if(el){ el.textContent = ""; setTimeout(() => el.textContent = msg, 40); } };

  /* ---------------- מקלדת פסנתר ---------------- */
  const WHITE = ["C","D","E","F","G","A","B"];
  const BLACK_AFTER = { "C":"C#","D":"D#","F":"F#","G":"G#","A":"A#" };
  const TYPE_KEYS = ["a","s","d","f","g","h","j","k","l",";"];

  function piano(opts){
    const o = Object.assign({ from:"C4", octaves:2, keys:[], label:"", seq:false, chord:false, timbre:"piano" }, opts);
    const startOct = parseInt(o.from.slice(-1), 10);
    if(typeof Device !== "undefined") o.octaves = Device.pianoOctaves(o.octaves);
    const wrap = document.createElement("div");
    wrap.className = "block";

    if(o.label){
      const p = document.createElement("p");
      p.className = "muted"; p.innerHTML = o.label;
      wrap.appendChild(p);
    }

    if(typeof Device !== "undefined"){
      const hint = Device.rotateHint();
      if(hint) wrap.appendChild(hint);
    }
    const scroll = document.createElement("div");
    scroll.className = "piano-wrap";
    const kb = document.createElement("div");
    kb.className = "piano";
    kb.setAttribute("role", "group");
    kb.setAttribute("aria-label", t("lesson.keyboardAria"));

    let whiteIdx = 0;
    const allNotes = [];
    for(let oc = 0; oc < o.octaves; oc++){
      WHITE.forEach(w => {
        const n = w + (startOct + oc);
        allNotes.push(n);
        kb.appendChild(makeKey(n, "white", TYPE_KEYS[whiteIdx++], o));
        if(BLACK_AFTER[w]){
          const bn = BLACK_AFTER[w] + (startOct + oc);
          allNotes.push(bn);
          kb.appendChild(makeKey(bn, "black", null, o));
        }
      });
    }
    scroll.appendChild(kb);
    wrap.appendChild(scroll);

    /* הדגשת תווים */
    (o.keys || []).forEach(n => {
      const el = kb.querySelector('[data-note="' + n + '"]');
      if(el) el.classList.add("hl");
    });

    /* כפתורי הפעלה */
    if(o.keys && o.keys.length){
      const row = document.createElement("div");
      row.className = "row";
      const b1 = document.createElement("button");
      b1.className = "btn btn-sm";
      b1.textContent = o.chord ? t("lesson.playChord") : t("lesson.playMarked");
      b1.addEventListener("click", () => {
        Audio1.ensure();
        if(o.chord){
          Audio1.chord(o.keys, 1.6, o.timbre, .02);
          live(o.keys.map(noteHe).join(", "));
        }else{
          o.keys.forEach((n, i) => setTimeout(() => {
            Audio1.playNote(n, .55, o.timbre, .5);
            flash(kb, n);
          }, i * 420));
          live(o.keys.map(noteHe).join(", "));
        }
      });
      row.appendChild(b1);

      const b2 = document.createElement("button");
      b2.className = "btn btn-ghost btn-sm";
      b2.textContent = t("lesson.noteNamesBtn");
      b2.addEventListener("click", () => {
        alert(o.keys.map(n => noteLabel(n)).join("\n"));
      });
      row.appendChild(b2);
      wrap.appendChild(row);
    }

    /* נגינה במקלדת המחשב – כמה מקשים יחד */
    const held = new Set();
    wrap.addEventListener("keydown", e => {
      const idx = TYPE_KEYS.indexOf(e.key.toLowerCase());
      if(idx < 0 || held.has(idx)) return;
      const whites = [...kb.querySelectorAll(".key.white")];
      if(whites[idx]){ e.preventDefault(); held.add(idx); whites[idx].play(); }
    });
    wrap.addEventListener("keyup", e => {
      const idx = TYPE_KEYS.indexOf(e.key.toLowerCase());
      if(idx >= 0) held.delete(idx);
    });
    wrap.addEventListener("blur", () => held.clear(), true);

    return wrap;
  }

  function makeKey(note, cls, typeKey, o){
    const b = document.createElement("button");
    b.type = "button";
    /* הצבע יושב על הקליד עצמו, לא על התווית – התווית ניתנת להסתרה
       והצבע חייב להיות גלוי תמיד. השם והצבע מופיעים יחד. */
    b.className = "key " + cls + " " + noteColorClass(note);
    b.dataset.note = note;
    b.setAttribute("aria-label", noteLabel(note));
    const lbl = document.createElement("span");
    lbl.className = "lbl opt-lbl";
    lbl.textContent = noteHe(note);
    b.appendChild(lbl);

    b.play = () => {
      Audio1.ensure();
      Audio1.playNote(note, .8, o.timbre || "piano", .5);
      b.classList.add("active");
      setTimeout(() => b.classList.remove("active"), 220);
      live(noteHe(note));
      b.dispatchEvent(new CustomEvent("keyplay", { bubbles: true, detail: { note } }));
    };

    /* pointerdown ולא click: כך אפשר ללחוץ על כמה קלידים בו-זמנית,
       גם בעכבר וגם בריבוי-מגע בנייד. */
    b.addEventListener("pointerdown", e => {
      e.preventDefault();
      if(b.dataset.down === "1") return;
      b.dataset.down = "1";
      b.play();
    });
    const release = () => { delete b.dataset.down; };
    b.addEventListener("pointerup", release);
    b.addEventListener("pointercancel", release);
    b.addEventListener("pointerleave", release);
    /* מקלדת פיזית ונגישות – Enter/רווח עדיין מנגנים */
    b.addEventListener("keydown", e => {
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); b.play(); }
    });
    return b;
  }

  function flash(kb, note){
    const el = kb.querySelector('[data-note="' + note + '"]');
    if(!el) return;
    el.classList.add("hl2");
    setTimeout(() => el.classList.remove("hl2"), 340);
  }

  /* ---------------- דיאגרמת אקורד ---------------- */
  function chordDiagram(instId, chordId){
    const list = CHORDS[instId] || [];
    const ch = list.find(c => c.id === chordId);
    const wrap = document.createElement("figure");
    wrap.className = "chord-card block";
    if(!ch){ wrap.textContent = "?"; return wrap; }

    const strings = ch.frets.length;
    const frets = 4, w = 34 * (strings - 1) + 60, h = 210;
    const x0 = 30, y0 = 44, sp = 34, fh = 34;

    let svg = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"
      aria-label="${esc(t("chord.diagramAria", { name: chLabel(ch) }))}: ${esc(describeChord(ch))}">`;
    // אגוז
    svg += `<rect x="${x0-2}" y="${y0-6}" width="${sp*(strings-1)+4}" height="6" fill="currentColor"/>`;
    // סריגים
    for(let f = 0; f <= frets; f++)
      svg += `<line x1="${x0}" y1="${y0+f*fh}" x2="${x0+sp*(strings-1)}" y2="${y0+f*fh}" stroke="currentColor" stroke-width="1.5" opacity=".55"/>`;
    // מיתרים
    for(let s = 0; s < strings; s++)
      svg += `<line x1="${x0+s*sp}" y1="${y0}" x2="${x0+s*sp}" y2="${y0+frets*fh}" stroke="currentColor" stroke-width="1.8" opacity=".75"/>`;
    // סימונים
    ch.frets.forEach((f, i) => {
      const x = x0 + i * sp;
      if(f === -1){
        svg += `<text x="${x}" y="${y0-14}" text-anchor="middle" font-size="17" fill="currentColor">✕</text>`;
      }else if(f === 0){
        svg += `<circle cx="${x}" cy="${y0-19}" r="7" fill="none" stroke="currentColor" stroke-width="2"/>`;
      }else{
        const y = y0 + (f - .5) * fh;
        svg += `<circle cx="${x}" cy="${y}" r="13" fill="var(--brand)"/>`;
        const fin = ch.fingers && ch.fingers[i];
        if(fin) svg += `<text x="${x}" y="${y+5}" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">${fin}</text>`;
      }
    });
    svg += "</svg>";

    wrap.innerHTML = `<figcaption class="chord-name">${esc(chLabel(ch))}</figcaption><small>${esc(I18N.chordTip(instId, ch) || "")}</small>${svg}`;

    const row = document.createElement("div");
    row.className = "row";
    row.style.justifyContent = "center";

    const play = document.createElement("button");
    play.className = "btn btn-sm";
    play.textContent = t("lesson.hearChord");
    play.addEventListener("click", () => {
      Audio1.ensure();
      Audio1.chord(ch.notes, 2, instId === "ukulele" ? "uke" : "guitar", .045);
      live(ch.name);
    });
    row.appendChild(play);

    const slow = document.createElement("button");
    slow.className = "btn btn-ghost btn-sm";
    slow.textContent = t("lesson.stringByString");
    slow.addEventListener("click", () => {
      Audio1.ensure();
      ch.notes.forEach((n, i) => setTimeout(() => Audio1.playNote(n, .8, instId === "ukulele" ? "uke" : "guitar", .5), i * 520));
    });
    row.appendChild(slow);
    wrap.appendChild(row);

    const desc = document.createElement("p");
    desc.className = "muted";
    desc.style.marginTop = "10px";
    desc.style.fontSize = ".88rem";
    desc.textContent = describeChord(ch);
    wrap.appendChild(desc);

    return wrap;
  }

  function chLabel(ch){
    return I18N.has("chord." + ch.id) ? ch.id + " (" + t("chord." + ch.id) + ")" : ch.name;
  }
  function describeChord(ch){
    const names = ch.frets.length === 6
      ? ["chord.s6","chord.s5","chord.s4","chord.s3","chord.s2","chord.s1"].map(k => t(k))
      : ["chord.u4","chord.u3","chord.u2","chord.u1"].map(k => t(k));
    return ch.frets.map((f, i) =>
      names[i] + ": " + (f === -1 ? t("chord.muted") : f === 0 ? t("chord.openStr")
        : t("chord.fret") + " " + f + (ch.fingers[i] ? ", " + t("chord.finger") + " " + ch.fingers[i] : ""))
    ).join(" | ");
  }

  /* ---------------- נגן מנגינה ---------------- */
  function melody(o){
    const song = o.songId ? SONGS.find(s => s.id === o.songId) : null;
    const notes = o.notes || (song ? song.notes : []);
    const bpm = o.bpm || (song ? song.bpm : 90);
    const timbre = o.timbre || "piano";
    const title = o.title || (song ? I18N.songTitle(song) : "");

    const wrap = document.createElement("div");
    wrap.className = "card block";
    wrap.innerHTML = `<div class="between"><b>${esc(title)}</b>
      <span class="pill">${notes.length} ${t("common.notes")} · ${bpm} BPM</span></div>`;

    const strip = document.createElement("div");
    strip.className = "row melstrip";      /* melstrip מאלץ כיוון LTR – ראו app.css */
    strip.style.margin = "12px 0";
    strip.setAttribute("aria-hidden", "true");
    notes.forEach(([n], i) => {
      const s = document.createElement("span");
      s.className = "pill" + (n ? " nco " + noteColorClass(n) : "");
      s.dataset.i = i;
      s.textContent = n ? noteHe(n) : "–";
      strip.appendChild(s);
    });
    wrap.appendChild(strip);

    const row = document.createElement("div");
    row.className = "row";

    let speed = 1;
    const btn = document.createElement("button");
    btn.className = "btn btn-sm";
    btn.textContent = t("common.play");
    btn.addEventListener("click", () => {
      if(Audio1.playing){ Audio1.stopSequence(); btn.textContent = t("common.play"); return; }
      Audio1.ensure();
      btn.textContent = t("common.stop");
      Audio1.playSequence(notes, bpm * speed, timbre,
        (n, i) => {
          strip.querySelectorAll(".pill").forEach(p => p.classList.remove("on"));
          const el = strip.querySelector('[data-i="' + i + '"]');
          if(el){ el.classList.add("on"); el.style.background = "var(--brand)"; el.style.color = "#fff";
            setTimeout(() => { el.style.background = ""; el.style.color = ""; }, 400); }
        },
        () => { btn.textContent = t("common.play"); Store.award("song"); });
      live(title);
    });
    row.appendChild(btn);

    [[.5,t("lesson.speedHalf")],[.75,t("lesson.speedSlow")],[1,t("lesson.speedNormal")]].forEach(([v, lbl]) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = lbl;
      if(v === 1) b.classList.add("on");
      b.addEventListener("click", () => {
        speed = v;
        row.querySelectorAll(".chip").forEach(c => c.classList.remove("on"));
        b.classList.add("on");
        live(t("lesson.speed") + ": " + lbl);
      });
      row.appendChild(b);
    });
    wrap.appendChild(row);

    const list = document.createElement("details");
    list.innerHTML = "<summary>" + t("lesson.noteListSummary") + "</summary><p>" +
      notes.map(([n, l]) => (n ? noteLabel(n) : t("lesson.rest")) + " – " + l + " " + t("lesson.beats")).join("; ") + "</p>";
    list.style.marginTop = "10px";
    wrap.appendChild(list);

    if(song && song.origin){
      const src = document.createElement("p");
      src.className = "muted";
      src.style.fontSize = ".82rem";
      src.style.marginTop = "8px";
      src.textContent = t("common.source") + ": " + I18N.songOrigin(song);
      wrap.appendChild(src);
    }
    return wrap;
  }

  /* ---------------- ווידג'ט מקצב ---------------- */
  function rhythm(o){
    const pattern = o.pattern || [1,0,1,0,1,0,1,0];
    const bpm = o.bpm || 80;
    const wrap = document.createElement("div");
    wrap.className = "card block";
    wrap.innerHTML = `<div class="between"><b>${esc(o.title || t("lesson.rhythmEx"))}</b><span class="pill">${bpm} BPM</span></div>`;

    const beats = document.createElement("div");
    beats.className = "rhythm";
    beats.style.margin = "12px 0";
    beats.setAttribute("role", "img");
    /* ספירת המקצב בשפת הממשק – "1 וְ 2 וְ" בעברית, "1 and 2 and" באנגלית וכו' */
    const AND = () => t("rhythm.and");
    beats.setAttribute("aria-label", t("rhythm.aria") + ": " + pattern.map((p, i) =>
      (i % 2 === 0 ? (i / 2 + 1) : AND()) + (p ? " – " + t("rhythm.hit") : " – " + t("rhythm.silent"))).join(", "));
    pattern.forEach((p, i) => {
      const b = document.createElement("div");
      b.className = "beat" + (p ? " strong" : "");
      b.dataset.i = i;
      b.textContent = i % 2 === 0 ? (i / 2 + 1) : AND();
      beats.appendChild(b);
    });
    wrap.appendChild(beats);

    let timer = null, idx = 0;
    const btn = document.createElement("button");
    btn.className = "btn btn-sm";
    btn.textContent = t("lesson.playRhythm");
    btn.addEventListener("click", () => {
      if(timer){ clearInterval(timer); timer = null; btn.textContent = t("lesson.playRhythm");
        beats.querySelectorAll(".beat").forEach(b => b.classList.remove("on")); return; }
      Audio1.ensure();
      btn.textContent = t("common.stop");
      idx = 0;
      const step = () => {
        beats.querySelectorAll(".beat").forEach(b => b.classList.remove("on"));
        const el = beats.querySelector('[data-i="' + (idx % pattern.length) + '"]');
        if(el) el.classList.add("on");
        if(pattern[idx % pattern.length]){
          Audio1.click(idx % pattern.length === 0);
          if(navigator.vibrate && document.documentElement.dataset.vibrate === "1") navigator.vibrate(35);
        }
        idx++;
      };
      step();
      timer = setInterval(step, 30000 / bpm);
    });
    wrap.appendChild(btn);
    return wrap;
  }

  /* ---------------- פדים לתופים ---------------- */
  /* השם מגיע מחבילת השפה, כדי שהפדים לא יישארו בעברית בתשע השפות האחרות */
  const DRUMS = [
    { k:"kick",  key:"f", ico:"🦶" },
    { k:"snare", key:"j", ico:"🥁" },
    { k:"hihat", key:"h", ico:"🎩" },
    { k:"tom",   key:"g", ico:"🛢️" },
    { k:"crash", key:"k", ico:"💥" }
  ];
  const drumName = d => t("drum." + d.k);
  function drumPads(){
    const wrap = document.createElement("div");
    wrap.className = "block";
    wrap.innerHTML = "<p class='muted'>" + t("lesson.padsHint") + "</p>";
    const grid = document.createElement("div");
    grid.className = "grid g4 padgrid";   /* padgrid מאלץ LTR – סדר הכלים בערכה */
    DRUMS.forEach(d => {
      const b = document.createElement("button");
      b.className = "pad";
      b.type = "button";
      const nm = drumName(d);
      b.innerHTML = `<div style="font-size:1.6rem" aria-hidden="true">${d.ico}</div>${esc(nm)}<br>` +
                    `<small class="muted">${esc(t("lesson.keyLabel", { k: d.key.toUpperCase() }))}</small>`;
      b.setAttribute("aria-label", nm + ", " + t("lesson.keyLabel", { k: d.key.toUpperCase() }));
      b.addEventListener("click", () => { Audio1.ensure(); Audio1.drum(d.k); hit(b); });
      grid.appendChild(b);
      d.el = b;
    });
    wrap.appendChild(grid);
    const onKey = e => {
      const d = DRUMS.find(x => x.key === e.key.toLowerCase());
      if(d && !e.repeat){ Audio1.ensure(); Audio1.drum(d.k); hit(d.el); }
    };
    document.addEventListener("keydown", onKey);
    wrap._cleanup = () => document.removeEventListener("keydown", onKey);
    return wrap;
  }
  function hit(el){ el.classList.add("on"); setTimeout(() => el.classList.remove("on"), 130); }

  return { piano, chordDiagram, melody, rhythm, drumPads, esc, live };
})();
