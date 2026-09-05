/* ==========================================================================
   tools.js – כלי אימון: מטרונום, מכוון, אימון אוזן, ספריית אקורדים,
   טיימר תרגול וסולמות. כל הכלים חינמיים וזמינים גם ללא מנוי. (רב-לשוני)
   ========================================================================== */

const Tools = (() => {
  const esc = UI.esc;
  let cleanup = null;
  function reset(){ if(cleanup){ cleanup(); cleanup = null; } Metronome.stop(); Tuner.stop(); Audio1.stopSequence(); }

  /* ================= מרכז הכלים ================= */
  function hub(main){
    reset();
    const items = [
      ["metronome","⏱️"], ["tuner","🎯"], ["ear","👂"],
      ["chords","🎸"], ["timer","🍅"], ["scales","🎼"],
      ["guide","🎯","guide/piano"], ["backing","🎶","tools/backing"], ["playalong","🎤","tools/coach"],
      ["changes","⏲️","tools/changes"], ["reading","🎼","tools/reading"]
    ];
    main.innerHTML = `<section class="section"><div class="wrap">
      <h1>${t("tools.h1")}</h1>
      <p class="lead">${t("tools.lead")}</p>
      <div class="grid g3" style="margin-top:20px">
        ${items.map(([id, ico, path]) => `<a class="inst-card" href="#/${path || ("tools/" + id)}">
          <div class="inst-emoji" aria-hidden="true">${ico}</div>
          <h2 class="card-h">${t("tools." + id)}</h2>
          <p class="muted" style="margin:0">${t("tools." + id + "D")}</p></a>`).join("")}
      </div>
      <a class="card" href="#/report" style="margin-top:18px;display:block;text-decoration:none;color:inherit">
        <b>📄 ${t("report.h1")}</b>
        <div class="muted">${t("report.lead")}</div>
      </a>
    </div></section>`;
  }

  /* ================= מטרונום ================= */
  function metronome(main){
    reset();
    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/tools" class="pill">${t("tools.all")}</a>
      <h1 style="margin-top:14px">⏱️ ${t("tools.metronome")}</h1>
      <div class="card">
        <div class="metro-visual" id="mv" role="status" aria-live="off" aria-label="${esc(t("metro.beatAria"))}">1</div>
        <div class="between" style="margin-top:16px">
          <b id="bpmOut" style="font-size:1.5rem" dir="ltr">80 BPM</b>
          <div class="row seqrow">
            ${[-5,-1,1,5].map(n => `<button class="chip" data-bpm="${n}" aria-label="${n > 0 ? "+" : ""}${n} BPM">${n > 0 ? "+" : "−"}${Math.abs(n)}</button>`).join("")}
          </div>
        </div>
        <label for="bpm" class="sr-only">${t("metro.speedLabel")}</label>
        <input type="range" id="bpm" min="30" max="220" value="80" aria-describedby="bpmOut">
        <div class="row seqrow" style="margin-top:10px">
          <span class="muted">${t("metro.beatsPerBar")}</span>
          ${[2,3,4,6].map(n => `<button class="chip ${n === 4 ? "on" : ""}" data-beats="${n}">${n}/4</button>`).join("")}
        </div>
        <div class="row" style="margin-top:16px">
          <button class="btn" id="startBtn">${t("metro.start")}</button>
          <button class="btn btn-ghost" id="tapBtn">${t("metro.tap")}</button>
        </div>
        <p class="hint">${t("metro.hint")}</p>
      </div>
      <div class="card" style="margin-top:16px">
        <h2 class="card-h">🚀 ${t("speed.h1")}</h2>
        <p class="muted" style="margin-top:0">${t("speed.lead")}</p>
        <div class="speedgrid">
          <div class="field"><label for="spFrom">${t("speed.from")}</label>
            <input type="number" id="spFrom" value="60" min="30" max="200"></div>
          <div class="field"><label for="spTo">${t("speed.to")}</label>
            <input type="number" id="spTo" value="100" min="30" max="220"></div>
          <div class="field"><label for="spStep">${t("speed.step")}</label>
            <input type="number" id="spStep" value="4" min="1" max="20"></div>
          <div class="field"><label for="spBars">${t("speed.bars")}</label>
            <input type="number" id="spBars" value="4" min="1" max="16"></div>
        </div>
        <div class="between" style="margin:6px 0 12px">
          <span class="pill">${t("speed.now")}: <b id="spNow" dir="ltr">—</b></span>
          <span class="feedback ok" id="spMsg" role="status" aria-live="polite"></span>
        </div>
        <button class="btn w100" id="spGo">${t("speed.start")}</button>
        <p class="hint">${t("speed.tip")}</p>
      </div>

      <div class="card" style="margin-top:16px">
        <h2 class="card-h">${t("metro.recH")}</h2>
        <div class="row seqrow">
          ${[60,80,100,120].map(v => `<button class="chip" data-set="${v}">${v} – ${t("metro.rec" + v)}</button>`).join("")}
        </div>
        <p class="muted" style="margin-top:12px">${t("metro.golden")}</p>
      </div>
    </div></section>`;

    const mv = main.querySelector("#mv"), out = main.querySelector("#bpmOut"), rng = main.querySelector("#bpm");
    let beats = 4, running = false, taps = [];
    const setBpm = v => { v = Math.max(30, Math.min(220, v)); rng.value = v; out.textContent = v + " BPM"; Metronome.setBpm(v); };
    /* מאמן מהירות: מעלה את הקצב אוטומטית כל כמה תיבות */
    const sp = { on:false, to:100, step:4, bars:4, count:0 };
    const spMsg = () => main.querySelector("#spMsg");
    const onBeat = (i, strong) => {
      mv.textContent = i + 1;
      mv.classList.add("flash");
      setTimeout(() => mv.classList.remove("flash"), strong ? 130 : 90);
      if(sp.on && i === 0){
        sp.count++;
        if(sp.count % sp.bars === 0){
          const cur = +rng.value;
          if(cur >= sp.to){
            sp.on = false;
            main.querySelector("#spGo").textContent = t("speed.start");
            spMsg().textContent = t("speed.reached", { bpm:sp.to });
            UI.live(t("speed.reached", { bpm:sp.to }));
            Store.logPractice(3, t("speed.h1") + " " + sp.to + " BPM");
            return;
          }
          const next = Math.min(sp.to, cur + sp.step);
          setBpm(next);                      // מעדכן גם את המטרונום, בלי לאפס את התיבה
          main.querySelector("#spNow").textContent = next + " BPM";
          UI.live(next + " BPM");
        }
      }
    };
    const toggle = () => {
      running = !running;
      if(running){ Metronome.start(+rng.value, beats, onBeat); main.querySelector("#startBtn").textContent = t("metro.stop"); Store.award("metro"); }
      else { Metronome.stop(); main.querySelector("#startBtn").textContent = t("metro.start"); mv.textContent = "1"; }
    };
    main.querySelector("#startBtn").addEventListener("click", toggle);
    rng.addEventListener("input", () => setBpm(+rng.value));
    main.querySelectorAll("[data-bpm]").forEach(b => b.addEventListener("click", () => setBpm(+rng.value + (+b.dataset.bpm))));
    main.querySelectorAll("[data-set]").forEach(b => b.addEventListener("click", () => setBpm(+b.dataset.set)));
    main.querySelectorAll("[data-beats]").forEach(b => b.addEventListener("click", () => {
      main.querySelectorAll("[data-beats]").forEach(x => x.classList.remove("on"));
      b.classList.add("on"); beats = +b.dataset.beats;
      if(running){ Metronome.stop(); Metronome.start(+rng.value, beats, onBeat); }
    }));
    main.querySelector("#tapBtn").addEventListener("click", () => {
      const now = performance.now();
      taps = taps.filter(x => now - x < 2500); taps.push(now);
      if(taps.length > 1) setBpm(Math.round(60000 / ((taps[taps.length-1] - taps[0]) / (taps.length - 1))));
    });
    const key = e => {
      if(e.target.tagName === "INPUT" && e.target.type !== "range") return;
      if(e.code === "Space"){ e.preventDefault(); toggle(); }
      if(e.key === "ArrowRight") setBpm(+rng.value + 1);
      if(e.key === "ArrowLeft") setBpm(+rng.value - 1);
    };
    document.addEventListener("keydown", key);

    main.querySelector("#spGo").addEventListener("click", () => {
      if(sp.on){
        sp.on = false;
        main.querySelector("#spGo").textContent = t("speed.start");
        spMsg().textContent = "";
        return;
      }
      const from = Math.max(30, Math.min(220, +main.querySelector("#spFrom").value || 60));
      sp.to   = Math.max(from + 1, Math.min(220, +main.querySelector("#spTo").value || 100));
      sp.step = Math.max(1, +main.querySelector("#spStep").value || 4);
      sp.bars = Math.max(1, +main.querySelector("#spBars").value || 4);
      sp.count = 0; sp.on = true;
      setBpm(from);
      main.querySelector("#spNow").textContent = from + " BPM";
      spMsg().textContent = "";
      main.querySelector("#spGo").textContent = t("speed.stop");
      if(!running) toggle(); else { Metronome.stop(); Metronome.start(from, beats, onBeat); }
    });

    cleanup = () => { document.removeEventListener("keydown", key); sp.on = false; };
  }

  /* ================= מכוון ================= */
  function tuner(main){
    reset();
    const TUNABLE = INSTRUMENTS.filter(i => i.tune);
    let inst = TUNABLE.find(i => i.id === "guitar") || TUNABLE[0];
    let strings = inst.tune.split(" ");
    let micOn = false, droneIdx = -1;

    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/tools" class="pill">${t("tools.all")}</a>
      <h1 style="margin-top:14px">🎯 ${t("tools.tuner")}</h1>
      <p class="lead">${t("tuner.lead")}</p>

      <div class="card">
        <div class="row" style="margin-bottom:12px">
          ${TUNABLE.map(i => `<button class="chip ${i.id === inst.id ? "on" : ""}" data-ti="${i.id}">${i.emoji} ${esc(I18N.instName(i.id))}</button>`).join("")}
        </div>
        <div class="between" style="margin-bottom:6px">
          <b id="tnStd" dir="ltr"></b>
          <span class="muted" id="tnStdLbl">${t("tuner.standard")}</span>
        </div>
        <div class="strings" id="tnStrings" role="group" aria-label="${esc(t("tuner.byString"))}"></div>
        <p class="hint">${t("tuner.droneHint")}</p>
      </div>

      <div class="card" style="margin-top:16px">
        <h2 style="margin-top:0;font-size:1.15rem">${t("tuner.micH")}</h2>
        <p class="muted">${t("tuner.micP")}</p>
        <div id="micNotice"></div>
        <button class="btn" id="micBtn">${t("tuner.micBtn")}</button>

        <div id="tunerBox" hidden style="margin-top:18px">
          <div class="center muted" id="tstring">${t("tuner.playNote")}</div>
          <div class="tuner-note" id="tnote" role="status" aria-live="polite">—</div>
          <div class="muted center" id="tfreq">—</div>
          <div class="tuner-needle" style="margin:16px 0"><i id="needle"></i></div>
          <div class="center" id="tverdict" style="font-weight:700">${t("tuner.playNote")}</div>
          <div class="center muted" id="tadvice" style="margin-top:6px"></div>
        </div>
      </div>

      <div class="tip" style="margin-top:16px">${t("tuner.noMicTip")}</div>
      <p class="muted" style="margin-top:10px">
        <a href="https://en.wikipedia.org/wiki/Guitar_tunings" target="_blank" rel="noopener noreferrer">
          ${t("tuner.moreLink")} ↗</a></p>
    </div></section>`;

    const $ = id => main.querySelector(id);

    /* הסבר קבוע במסך במקום הודעה חולפת – למשתמש מגיע לדעת *למה* */
    function showMicNotice(res){
      const box = $("#micNotice");
      if(!box) return;
      box.innerHTML = "";
      const d = document.createElement("div");
      d.className = "warnbox";
      d.innerHTML = "<b>" + t("mic.title") + ":</b> " + (res.message || "");
      box.appendChild(d);
    }
    /* בודקים מראש ומסבירים עוד לפני שהמשתמש לוחץ */
    Mic.status().then(st => {
      const box = $("#micNotice"), n = Mic.notice(st);
      if(box && n) box.appendChild(n);
    });

    function drawStrings(){
      strings = inst.tune.split(" ");
      $("#tnStd").textContent = strings.join(" ");
      const box = $("#tnStrings");
      box.innerHTML = strings.map((n, i) =>
        `<button class="stringbtn" data-s="${i}">
           <span class="stringnum">${strings.length - i}</span>
           <span class="stringnote" dir="ltr">${n}</span>
           <small class="muted">${noteHe(n)}</small>
         </button>`).join("");
      box.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => {
        const i = +b.dataset.s;
        Audio1.ensure();
        if(droneIdx === i){ Audio1.droneStop(); droneIdx = -1; }
        else if(Audio1.droneStart(noteToFreq(strings[i]))){ droneIdx = i; UI.live(noteHe(strings[i])); }
        else { App.toast(t("tuner.mutedWarn")); droneIdx = -1; }
        box.querySelectorAll("[data-s]").forEach(x =>
          x.classList.toggle("ringing", +x.dataset.s === droneIdx));
      }));
    }
    drawStrings();

    main.querySelectorAll("[data-ti]").forEach(b => b.addEventListener("click", () => {
      Audio1.droneStop(); droneIdx = -1;
      main.querySelectorAll("[data-ti]").forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      inst = INST[b.dataset.ti];
      drawStrings();
    }));

    /* איזה מיתר הכי קרוב לתדר שנשמע, ובכמה סנט הוא רחוק ממנו */
    function nearestString(freq){
      let best = -1, bestC = 1e9;
      strings.forEach((n, i) => {
        const c = 1200 * Math.log2(freq / noteToFreq(n));
        if(Math.abs(c) < Math.abs(bestC)){ bestC = c; best = i; }
      });
      return { i: best, cents: bestC };
    }

    $("#micBtn").addEventListener("click", async () => {
      if(micOn){ Tuner.stop(); micOn = false; $("#micBtn").textContent = t("tuner.micBtn"); return; }
      Audio1.ensure();
      const box = $("#tunerBox");
      const res = await Mic.open(d => {
        if(!d) return;
        const near = nearestString(d.freq);
        /* אם הצליל רחוק ממש מכל מיתר – מציגים את התו הכרומטי בלבד */
        const onString = Math.abs(near.cents) <= 250;
        const cents = onString ? near.cents : d.cents;

        $("#tstring").textContent = onString
          ? t("tuner.stringN", { n: strings.length - near.i, note: strings[near.i] })
          : t("tuner.offAny");
        $("#tnote").textContent = noteLabel(d.label);
        $("#tfreq").textContent = d.freq.toFixed(1) + " " + t("tuner.hz");
        $("#needle").style.insetInlineStart =
          Math.max(0, Math.min(100, 50 + Math.max(-50, Math.min(50, cents)))) + "%";

        const v = $("#tverdict"), adv = $("#tadvice");
        main.querySelectorAll("[data-s]").forEach(x =>
          x.classList.toggle("hot", onString && +x.dataset.s === near.i));

        if(Math.abs(cents) <= 5){
          v.textContent = t("tuner.inTune"); v.style.color = "var(--ok)";
          adv.textContent = onString ? t("tuner.stringOk", { n: strings.length - near.i }) : "";
        }else if(cents < 0){
          v.textContent = t("tuner.flat"); v.style.color = "var(--accent)";
          adv.textContent = t("tuner.tighten", { c: Math.round(-cents) });
        }else{
          v.textContent = t("tuner.sharp"); v.style.color = "var(--accent)";
          adv.textContent = t("tuner.loosen", { c: Math.round(cents) });
        }
      });
      if(res.ok){ micOn = true; box.hidden = false; $("#micBtn").textContent = t("tuner.micOn"); }
      else { showMicNotice(res); }
    });

    cleanup = () => { Tuner.stop(); Audio1.droneStop(); };
  }

  /* ================= אימון אוזן ================= */
  function ear(main){
    reset();
    let mode = "note", current = null, score = 0, tries = 0;
    const NOTES = ["C4","D4","E4","F4","G4","A4","B4","C5"];
    const INTERVALS = [["iv.2M",2],["iv.3M",4],["iv.4P",5],["iv.5P",7],["iv.6M",9],["iv.8P",12]];
    const CHORD_TYPES = [["ct.maj",[0,4,7]],["ct.min",[0,3,7]],["ct.aug",[0,4,8]],["ct.dim",[0,3,6]]];

    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/tools" class="pill">${t("tools.all")}</a>
      <h1 style="margin-top:14px">👂 ${t("tools.ear")}</h1>
      <p class="lead">${t("ear.lead")}</p>
      <div class="row">
        <button class="chip on" data-mode="note">${t("ear.modeNote")}</button>
        <button class="chip" data-mode="interval">${t("ear.modeInterval")}</button>
        <button class="chip" data-mode="chord">${t("ear.modeChord")}</button>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="between"><b id="scoreTxt">${t("ear.score", { s:0, t:0 })}</b>
          <span class="pill" id="streakTxt">${t("ear.streak", { n:Store.state.earCorrect })}</span></div>
        <button class="btn w100" id="playQ" style="margin:16px 0">${t("ear.play")}</button>
        <div id="answers" class="grid g3 seqrow"></div>
        <div class="feedback" id="fb" role="status" aria-live="polite" style="margin-top:12px"></div>
      </div>
      <div class="tip" style="margin-top:16px">${t("ear.tip")}</div>
    </div></section>`;

    const ans = main.querySelector("#answers"), fb = main.querySelector("#fb");
    const scoreTxt = main.querySelector("#scoreTxt");

    function newQ(){
      fb.textContent = ""; fb.className = "feedback";
      ans.innerHTML = "";
      if(mode === "note"){
        current = NOTES[Math.floor(Math.random() * NOTES.length)];
        NOTES.forEach(n => addBtn(noteHe(n), n === current));
      }else if(mode === "interval"){
        const iv = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
        current = iv;
        INTERVALS.forEach(x => addBtn(t(x[0]), x[0] === iv[0]));
      }else{
        const ct = CHORD_TYPES[Math.floor(Math.random() * CHORD_TYPES.length)];
        current = ct;
        CHORD_TYPES.forEach(x => addBtn(t(x[0]), x[0] === ct[0]));
      }
      play();
    }
    function addBtn(label, isRight){
      const b = document.createElement("button");
      b.className = "btn btn-ghost";
      b.textContent = label;
      b.addEventListener("click", () => {
        tries++;
        if(isRight){
          score++; Store.state.earCorrect++; Store.save(); Store.checkBadges();
          fb.className = "feedback ok"; fb.textContent = t("ear.right");
          Store.addXp(3);
          setTimeout(newQ, 900);
        }else{
          Store.state.earCorrect = 0; Store.save();
          fb.className = "feedback no"; fb.textContent = t("ear.wrong");
        }
        scoreTxt.textContent = t("ear.score", { s:score, t:tries });
        main.querySelector("#streakTxt").textContent = t("ear.streak", { n:Store.state.earCorrect });
      });
      ans.appendChild(b);
    }
    function play(){
      Audio1.ensure();
      if(mode === "note"){
        Audio1.playNote("C4", .7, "piano", .4);
        setTimeout(() => Audio1.playNote(current, 1.2, "piano", .5), 900);
      }else if(mode === "interval"){
        const base = 60;
        Audio1.note(440 * Math.pow(2, (base - 69) / 12), .8, "piano", .5);
        setTimeout(() => Audio1.note(440 * Math.pow(2, (base + current[1] - 69) / 12), 1.1, "piano", .5), 800);
      }else{
        current[1].forEach(s => Audio1.note(440 * Math.pow(2, (60 + s - 69) / 12), 1.8, "piano", .32));
      }
    }
    main.querySelector("#playQ").addEventListener("click", play);
    main.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => {
      main.querySelectorAll("[data-mode]").forEach(x => x.classList.remove("on"));
      b.classList.add("on"); mode = b.dataset.mode; score = 0; tries = 0;
      scoreTxt.textContent = t("ear.score", { s:0, t:0 });
      newQ();
    }));
    newQ();
  }

  /* ================= ספריית אקורדים ================= */
  function chords(main){
    reset();
    main.innerHTML = `<section class="section"><div class="wrap">
      <a href="#/tools" class="pill">${t("tools.all")}</a>
      <h1 style="margin-top:14px">🎸 ${t("tools.chords")}</h1>
      <p class="lead">${t("chords.lead")}</p>
      <div class="row" style="margin:16px 0">
        <button class="chip on" data-inst="guitar">🎸 ${t("inst.guitar")}</button>
        <button class="chip" data-inst="ukulele">🪕 ${t("inst.ukulele")}</button>
      </div>
      <div id="chordGrid" class="grid g3"></div>
    </div></section>`;
    const grid = main.querySelector("#chordGrid");
    const draw = inst => {
      grid.innerHTML = "";
      (CHORDS[inst] || []).forEach(c => grid.appendChild(UI.chordDiagram(inst, c.id)));
    };
    draw("guitar");
    main.querySelectorAll("[data-inst]").forEach(b => b.addEventListener("click", () => {
      main.querySelectorAll("[data-inst]").forEach(x => x.classList.remove("on"));
      b.classList.add("on"); draw(b.dataset.inst);
    }));
  }

  /* ================= טיימר תרגול ================= */
  function timer(main){
    reset();
    let left = 600, tick = null, running = false, total = 600;
    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/tools" class="pill">${t("tools.all")}</a>
      <h1 style="margin-top:14px">🍅 ${t("tools.timer")}</h1>
      <div class="card center">
        <div id="clock" style="font-size:4rem;font-weight:800" role="timer" aria-live="off" dir="ltr">10:00</div>
        <div class="bar" style="margin:14px 0"><span id="tbar" style="width:0%"></span></div>
        <div class="row" style="justify-content:center">
          ${[5,10,15,25].map(m => `<button class="chip ${m === 10 ? "on" : ""}" data-min="${m}">${t("timer.minutes", { n:m })}</button>`).join("")}
        </div>
        <div class="row" style="justify-content:center;margin-top:16px">
          <button class="btn" id="tstart">${t("timer.start")}</button>
          <button class="btn btn-ghost" id="treset">${t("timer.reset")}</button>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h2 class="card-h">${t("timer.structH")}</h2>
        <ol class="steps">${[1,2,3,4].map(n => `<li>${t("timer.s" + n)}</li>`).join("")}</ol>
      </div>
    </div></section>`;

    const clock = main.querySelector("#clock"), bar = main.querySelector("#tbar");
    const draw = () => {
      clock.textContent = String(Math.floor(left / 60)).padStart(2,"0") + ":" + String(left % 60).padStart(2,"0");
      bar.style.width = Math.round((total - left) / total * 100) + "%";
    };
    const stop = () => { clearInterval(tick); tick = null; running = false; main.querySelector("#tstart").textContent = t("timer.start"); };
    main.querySelector("#tstart").addEventListener("click", () => {
      if(running){ stop(); return; }
      running = true; main.querySelector("#tstart").textContent = t("timer.pause");
      Audio1.ensure();
      tick = setInterval(() => {
        left--; draw();
        if(left <= 0){
          stop();
          [0,1,2].forEach(i => setTimeout(() => Audio1.playNote("C5", .5, "piano", .5), i * 300));
          Store.logPractice(Math.round(total / 60), t("timer.session"));
          App.toast(t("timer.done", { n:Math.round(total / 60) }));
        }
      }, 1000);
    });
    main.querySelector("#treset").addEventListener("click", () => { stop(); left = total; draw(); });
    main.querySelectorAll("[data-min]").forEach(b => b.addEventListener("click", () => {
      main.querySelectorAll("[data-min]").forEach(x => x.classList.remove("on"));
      b.classList.add("on"); total = left = +b.dataset.min * 60; draw();
    }));
    draw();
    cleanup = () => stop();
  }

  /* ================= סולמות ותיאוריה ================= */
  function scales(main){
    reset();
    const SCALES = [
      ["major",    [0,2,4,5,7,9,11,12]],
      ["minor",    [0,2,3,5,7,8,10,12]],
      ["pentaMaj", [0,2,4,7,9,12]],
      ["pentaMin", [0,3,5,7,10,12]],
      ["blues",    [0,3,5,6,7,10,12]]
    ];
    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/tools" class="pill">${t("tools.all")}</a>
      <h1 style="margin-top:14px">🎼 ${t("scales.h1")}</h1>
      <div class="card block">
        <h2 class="card-h">${t("scales.semiH")}</h2>
        <p>${t("scales.semiP")}</p>
        <p class="muted">${t("scales.recipe")}</p>
      </div>
      <div id="scaleList"></div>
      <div class="card block">
        <h2 class="card-h">${t("scales.circleH")}</h2>
        <p>${t("scales.circleP")}</p>
        <p class="muted">${t("scales.circleRule")}</p>
      </div>
    </div></section>`;
    const list = main.querySelector("#scaleList");
    SCALES.forEach(([key, steps]) => {
      const notes = steps.map(s => {
        const n = 60 + s;
        return NOTE_ORDER[(n % 12 + 12) % 12] + (Math.floor(n / 12) - 1);
      });
      const c = document.createElement("div");
      c.className = "card block";
      c.innerHTML = `<h2 class="card-h">${t("scales." + key)}</h2><p class="muted">${t("scales." + key + "D")}</p>`;
      c.appendChild(UI.melody({ title:t("scales." + key), bpm:96, notes:notes.map(n => [n, 1]) }));
      list.appendChild(c);
    });
  }

  return { hub, metronome, tuner, ear, chords, timer, scales, reset };
})();
