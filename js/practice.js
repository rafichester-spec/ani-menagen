/* ==========================================================================
   practice.js – פיצ'רים מתקדמים לתרגול
     • ליווי אוטומטי (מסך)         • מאמן נגינה עם מיקרופון
     • מד מעברי אקורדים            • מאמן קריאת תווים
     • דוח התקדמות למורה / להורה
   ========================================================================== */

const Practice = (() => {
  const esc = UI.esc;
  let cleanup = null;
  function reset(){
    if(cleanup){ try{ cleanup(); }catch(e){} cleanup = null; }
    Backing.stop(); Tuner.stop(); Audio1.stopSequence();
  }

  /* ================================================================
     1. ליווי אוטומטי
     ================================================================ */
  function backing(main, songId){
    reset();
    const withChords = SONGS.filter(s => s.chords);
    let song = SONG_BY_ID[songId] || withChords[0];
    let style = "pop", bpmMul = 1, withMelody = false, countIn = true;

    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/tools" class="pill">${t("tools.all")}</a>
      <h1 style="margin-top:14px">🎸 ${t("backing.h1")}</h1>
      <p class="lead">${t("backing.lead")}</p>

      <div class="card">
        <div class="field">
          <label for="bkSong">${t("backing.pick")}</label>
          <select id="bkSong">
            ${withChords.map(s => `<option value="${s.id}" ${s.id === song.id ? "selected" : ""}>
              ${esc(I18N.songTitle(s))} — ${t("common.level")} ${s.level}</option>`).join("")}
          </select>
        </div>

        <div class="row" style="margin-bottom:10px">
          <span class="muted">${t("backing.style")}</span>
          ${Backing.STYLE_IDS.map(id => `<button class="chip ${id === "pop" ? "on" : ""}" data-st="${id}">${t("backing.st." + id)}</button>`).join("")}
        </div>

        <div class="field">
          <label for="bkTempo">${t("backing.tempo")}: <b id="bkTempoOut" dir="ltr">${song.bpm} BPM</b></label>
          <input type="range" id="bkTempo" min="50" max="150" value="100" aria-describedby="bkTempoOut">
        </div>

        <div class="row" style="margin-bottom:12px">
          <label class="opt" style="flex:1;min-width:200px"><input type="checkbox" id="bkCount" checked>
            <span>${t("backing.countin")}</span></label>
          <label class="opt" style="flex:1;min-width:200px"><input type="checkbox" id="bkMel">
            <span>${t("backing.melody")}</span></label>
        </div>

        <div id="bkGrid" class="chordgrid" aria-hidden="true"></div>
        <div class="between" style="margin:10px 0">
          <b id="bkNow" dir="ltr">—</b>
          <span class="pill" id="bkBar">${t("backing.bar")} –</span>
        </div>

        <button class="btn w100" id="bkGo">${t("backing.start")}</button>
      </div>

      <div class="tip" style="margin-top:16px">${t("backing.tip")}</div>
      <div id="bkNone" class="warnbox" style="margin-top:12px" hidden>${t("backing.noChords")}</div>
    </div></section>`;

    const $ = id => main.querySelector(id);
    const grid = $("#bkGrid");

    function drawGrid(active){
      const chords = Backing.chordsFrom(song);
      grid.innerHTML = chords.map((c, i) =>
        `<span class="chordcell ${i === active ? "on" : ""}" data-i="${i}" dir="ltr">${esc(c)}</span>`).join("");
      $("#bkNone").hidden = chords.length > 0;
    }
    function refresh(){
      drawGrid(-1);
      $("#bkTempoOut").textContent = Math.round(song.bpm * bpmMul) + " BPM";
    }
    refresh();

    $("#bkSong").addEventListener("change", e => {
      song = SONG_BY_ID[e.target.value]; stopAll(); refresh();
    });
    main.querySelectorAll("[data-st]").forEach(b => b.addEventListener("click", () => {
      main.querySelectorAll("[data-st]").forEach(x => x.classList.remove("on"));
      b.classList.add("on"); style = b.dataset.st;
      if(Backing.isRunning()) go(true);
    }));
    $("#bkTempo").addEventListener("input", e => {
      bpmMul = +e.target.value / 100;
      $("#bkTempoOut").textContent = Math.round(song.bpm * bpmMul) + " BPM";
      if(Backing.isRunning()) go(true);
    });
    $("#bkCount").addEventListener("change", e => countIn = e.target.checked);
    $("#bkMel").addEventListener("change", e => withMelody = e.target.checked);

    function stopAll(){
      Backing.stop(); Audio1.stopSequence();
      $("#bkGo").textContent = t("backing.start");
      $("#bkNow").textContent = "—";
      $("#bkBar").textContent = t("backing.bar") + " –";
      drawGrid(-1);
    }
    function go(restart){
      if(Backing.isRunning() && !restart){ stopAll(); return; }
      Backing.stop(); Audio1.stopSequence();
      const chords = Backing.chordsFrom(song);
      const ok = Backing.start({
        chords, style, bpm: song.bpm * bpmMul, countIn: countIn && !restart,
        onTick: st => {
          if(st.countIn){ $("#bkNow").textContent = st.countIn; return; }
          $("#bkNow").textContent = st.chord;
          $("#bkBar").textContent = t("backing.bar") + " " + (st.bar + 1) + "/" + chords.length;
          if(st.step === 0) drawGrid(st.bar);
        }
      });
      if(!ok){ $("#bkNone").hidden = false; return; }
      $("#bkGo").textContent = t("backing.stop");
      if(withMelody){
        const delay = countIn && !restart ? (8 * 30000 / (song.bpm * bpmMul)) : 0;
        setTimeout(() => {
          if(Backing.isRunning())
            Audio1.playSequence(song.notes, song.bpm * bpmMul, (INST[song.instruments[0]] || INST.piano).timbre);
        }, delay);
      }
    }
    $("#bkGo").addEventListener("click", () => go(false));
    cleanup = stopAll;
  }

  /* ================================================================
     2. מאמן נגינה (מיקרופון)
     ================================================================ */
  function coach(main, songId){
    reset();
    const melodic = SONGS.filter(s => s.instruments.some(i => i !== "drums"));
    let song = SONG_BY_ID[songId] || melodic[0];
    let idx = 0, hit = 0, tries = 0, listening = false;
    let stableNote = null, stableCount = 0;

    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/tools" class="pill">${t("tools.all")}</a>
      <h1 style="margin-top:14px">🎤 ${t("pa.h1")}</h1>
      <p class="lead">${t("pa.lead")}</p>

      <div class="card">
        <div class="field">
          <label for="paSong">${t("backing.pick")}</label>
          <select id="paSong">
            ${melodic.map(s => `<option value="${s.id}" ${s.id === song.id ? "selected" : ""}>
              ${esc(I18N.songTitle(s))} — ${t("common.level")} ${s.level}</option>`).join("")}
          </select>
        </div>

        <div class="coach-box">
          <div class="coach-target">
            <small class="muted">${t("pa.expected")}</small>
            <div class="coach-note" id="paTarget" dir="ltr">—</div>
          </div>
          <div class="coach-arrow" aria-hidden="true">←</div>
          <div class="coach-target">
            <small class="muted">${t("pa.heard")}</small>
            <div class="coach-note dim" id="paHeard" dir="ltr">—</div>
          </div>
        </div>

        <div class="notestrip" id="paStrip" dir="ltr" aria-hidden="true"></div>
        <div class="bar" style="margin:12px 0"><span id="paBar" style="width:0%"></span></div>

        <div class="row between">
          <span class="pill">${t("pa.score")}: <b id="paHit">0</b>/${song.notes.filter(n => n[0]).length}</span>
          <span class="pill">${t("pa.accuracy")}: <b id="paAcc">—</b></span>
          <span class="pill">${t("pa.best")}: <b id="paBest">${Store.playAlongBest(song.id) || "—"}</b></span>
        </div>

        <div class="feedback" id="paMsg" role="status" aria-live="polite" style="margin-top:10px"></div>

        <div class="row" style="margin-top:14px">
          <button class="btn" id="paGo">${t("pa.mic")}</button>
          <button class="btn btn-ghost btn-sm" id="paSkip">${t("pa.skip")}</button>
          <button class="btn btn-ghost btn-sm" id="paReset">${t("pa.retry")}</button>
        </div>
      </div>

      <div class="tip" style="margin-top:16px">${t("pa.tip")}</div>
      <div id="paMicNotice"></div>
    </div></section>`;

    const $ = id => main.querySelector(id);
    const playable = () => song.notes.map((n, i) => ({ n: n[0], i })).filter(x => x.n);

    function drawStrip(){
      const strip = $("#paStrip");
      strip.innerHTML = song.notes.map(([n], i) =>
        `<span data-i="${i}" class="${n ? "nco " + noteColorClass(n) : ""}">${n ? noteHe(n) : "–"}</span>`).join("");
      mark();
    }
    function mark(){
      const strip = $("#paStrip");
      strip.querySelectorAll("span").forEach((s, i) => {
        s.classList.toggle("on", i === idx);
        s.classList.toggle("did", i < idx);
      });
      const cur = song.notes[idx];
      $("#paTarget").textContent = cur ? (cur[0] ? noteLabel(cur[0]) : "–") : "✓";
      const list = playable();
      const done = list.filter(x => x.i < idx).length;
      $("#paBar").style.width = Math.round(done / Math.max(1, list.length) * 100) + "%";
      const el = strip.querySelector(`[data-i="${idx}"]`);
      if(el) el.scrollIntoView({ block:"nearest", inline:"center" });
    }
    function skipRests(){
      while(idx < song.notes.length && !song.notes[idx][0]) idx++;
    }
    function resetRun(){
      idx = 0; hit = 0; tries = 0; stableNote = null; stableCount = 0;
      skipRests(); drawStrip();
      $("#paHit").textContent = "0"; $("#paAcc").textContent = "—";
      $("#paMsg").textContent = ""; $("#paMsg").className = "feedback";
    }
    resetRun();

    function finish(){
      stopMic();
      const list = playable();
      const pct = Math.round(hit / Math.max(1, list.length) * 100);
      const isBest = Store.setPlayAlongBest(song.id, pct);
      $("#paMsg").className = "feedback ok";
      $("#paMsg").textContent = t("pa.done") + " " + t("pa.doneMsg", { hit, total:list.length, pct });
      $("#paBest").textContent = Store.playAlongBest(song.id);
      if(isBest) App.toast(t("pa.newBest"));
      Store.logPractice(2, t("pa.h1") + " – " + I18N.songTitle(song));
    }

    function onPitch(d){
      if(!listening) return;
      if(!d){ stableCount = 0; return; }
      $("#paHeard").textContent = noteLabel(d.label);
      $("#paHeard").classList.remove("dim");

      const target = song.notes[idx] && song.notes[idx][0];
      if(!target) return;
      const targetPc = /^([A-G]#?)/.exec(normNote(target))[1];

      /* השוואה לפי מחלקת גובה (בלי אוקטבה) – גיטרה ובס מצלצלים אוקטבה נמוך יותר */
      const ok = d.name === targetPc && Math.abs(d.cents) <= 45;
      if(ok){
        stableCount = (stableNote === d.name) ? stableCount + 1 : 1;
        stableNote = d.name;
        if(stableCount >= 3){          // ~3 פריימים = כ-50 מ"ש של צליל יציב
          hit++; tries++;
          $("#paMsg").className = "feedback ok"; $("#paMsg").textContent = t("pa.hit");
          Audio1.click(false);
          idx++; skipRests();
          stableCount = 0; stableNote = null;
          $("#paHit").textContent = hit;
          $("#paAcc").textContent = Math.round(hit / Math.max(1, tries) * 100) + "%";
          if(idx >= song.notes.length){ finish(); return; }
          mark();
        }
      }else{
        stableNote = d.name; stableCount = 0;
      }
    }

    async function startMic(){
      Audio1.ensure();
      const res = await Mic.open(onPitch);
      if(!res.ok){
        const box = $("#paMicNotice");
        if(box){ box.innerHTML = ""; const d = document.createElement("div");
          d.className = "warnbox"; d.innerHTML = "<b>" + t("mic.title") + ":</b> " + (res.message || "");
          box.appendChild(d); }
        return;
      }
      listening = true;
      $("#paGo").textContent = t("pa.stop");
      $("#paMsg").className = "feedback"; $("#paMsg").textContent = t("pa.listening");
    }
    function stopMic(){
      listening = false; Tuner.stop();
      $("#paGo").textContent = t("pa.mic");
      $("#paHeard").textContent = "—"; $("#paHeard").classList.add("dim");
    }

    $("#paGo").addEventListener("click", () => listening ? stopMic() : startMic());
    $("#paSkip").addEventListener("click", () => {
      tries++; idx++; skipRests();
      if(idx >= song.notes.length){ finish(); return; }
      $("#paAcc").textContent = Math.round(hit / Math.max(1, tries) * 100) + "%";
      mark();
    });
    $("#paReset").addEventListener("click", resetRun);
    $("#paSong").addEventListener("change", e => {
      song = SONG_BY_ID[e.target.value];
      $("#paBest").textContent = Store.playAlongBest(song.id) || "—";
      resetRun();
    });
    cleanup = stopMic;
  }

  /* ================================================================
     3. מד מעברי אקורדים
     ================================================================ */
  function changes(main){
    reset();
    let inst = "guitar";
    let from = CHORDS.guitar[0].id, to = CHORDS.guitar[1].id;
    let count = 0, left = 60, timer = null, running = false;

    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/tools" class="pill">${t("tools.all")}</a>
      <h1 style="margin-top:14px">⏲️ ${t("cc.h1")}</h1>
      <p class="lead">${t("cc.lead")}</p>

      <div class="card">
        <div class="row" style="margin-bottom:10px">
          <span class="muted">${t("cc.inst")}</span>
          <button class="chip on" data-ci="guitar">🎸 ${t("inst.guitar")}</button>
          <button class="chip" data-ci="ukulele">🪕 ${t("inst.ukulele")}</button>
        </div>
        <div class="grid g2">
          <div class="field"><label for="ccFrom">${t("cc.from")}</label><select id="ccFrom"></select></div>
          <div class="field"><label for="ccTo">${t("cc.to")}</label><select id="ccTo"></select></div>
        </div>

        <div id="ccDiagrams" class="grid g2" style="margin-bottom:12px"></div>

        <button class="tapzone" id="ccTap" aria-live="off">
          <div class="tapcount" id="ccCount">0</div>
          <div class="muted">${t("cc.tap")}</div>
          <small class="muted">${t("cc.tapHint")}</small>
        </button>

        <div class="between" style="margin:12px 0">
          <span class="pill">${t("cc.left")}: <b id="ccLeft">60</b></span>
          <span class="pill">${t("cc.record")}: <b id="ccRec">—</b></span>
        </div>
        <button class="btn w100" id="ccGo">${t("cc.start")}</button>
        <div class="feedback" id="ccMsg" role="status" aria-live="polite" style="margin-top:10px"></div>
      </div>

      <div class="tip" style="margin-top:16px">${t("cc.tip")}</div>

      <div class="card" style="margin-top:16px" id="ccRecords"></div>
    </div></section>`;

    const $ = id => main.querySelector(id);

    function fillSelects(){
      const list = CHORDS[inst];
      ["#ccFrom","#ccTo"].forEach((sel, k) => {
        $(sel).innerHTML = list.map(c =>
          `<option value="${c.id}">${esc(I18N.has("chord." + c.id) ? c.id + " (" + t("chord." + c.id) + ")" : c.name)}</option>`).join("");
        $(sel).value = k === 0 ? list[0].id : (list[1] || list[0]).id;
      });
      from = $("#ccFrom").value; to = $("#ccTo").value;
      drawDiagrams(); showRecord();
    }
    function drawDiagrams(){
      const g = $("#ccDiagrams");
      g.innerHTML = "";
      g.appendChild(UI.chordDiagram(inst, from));
      g.appendChild(UI.chordDiagram(inst, to));
    }
    function showRecord(){
      const r = Store.chordRecord(inst, from, to);
      $("#ccRec").textContent = r || "—";
    }
    function listRecords(){
      const rs = Store.chordRecords();
      $("#ccRecords").innerHTML = rs.length
        ? `<h3>${t("cc.records")}</h3><ol class="replist">${rs.slice(0, 10).map(r =>
            `<li dir="auto"><b dir="ltr">${esc(r.from)} ↔ ${esc(r.to)}</b>
             <span class="pill">${r.n}</span>
             <small class="muted">${esc(I18N.instName(r.inst) || r.inst)}</small></li>`).join("")}</ol>`
        : `<h3>${t("cc.records")}</h3><p class="muted">—</p>`;
    }
    listRecords();

    main.querySelectorAll("[data-ci]").forEach(b => b.addEventListener("click", () => {
      main.querySelectorAll("[data-ci]").forEach(x => x.classList.remove("on"));
      b.classList.add("on"); inst = b.dataset.ci; stopRun(); fillSelects();
    }));
    $("#ccFrom").addEventListener("change", e => { from = e.target.value; drawDiagrams(); showRecord(); });
    $("#ccTo").addEventListener("change",   e => { to   = e.target.value; drawDiagrams(); showRecord(); });
    fillSelects();

    function tap(){
      if(!running) return;
      count++;
      const c = $("#ccCount"), z = $("#ccTap");
      if(c) c.textContent = count;
      if(z){ z.classList.add("flash"); setTimeout(() => z.classList.remove("flash"), 90); }
    }
    function startRun(){
      count = 0; left = 60; running = true;
      $("#ccCount").textContent = "0"; $("#ccLeft").textContent = "60";
      $("#ccGo").textContent = t("cc.stop");
      $("#ccMsg").textContent = ""; $("#ccMsg").className = "feedback";
      Audio1.ensure(); Audio1.click(true);
      timer = setInterval(() => {
        if(!$("#ccLeft")){ stopRun(); return; }     // המשתמש עזב את העמוד
        left--; $("#ccLeft").textContent = left;
        if(left <= 3 && left > 0) Audio1.click(false);
        if(left <= 0) endRun();
      }, 1000);
    }
    function endRun(){
      stopRun();
      const isRec = Store.setChordRecord(inst, from, to, count);
      $("#ccMsg").className = "feedback ok";
      $("#ccMsg").textContent = t("cc.result", { n:count });
      if(isRec){ App.toast(t("cc.newRecord", { n:count })); }
      showRecord(); listRecords();
      Store.logPractice(1, t("cc.h1") + " " + from + "↔" + to + ": " + count);
      [0,1,2].forEach(i => setTimeout(() => Audio1.playNote("C5", .4, "piano", .45), i * 220));
    }
    function stopRun(){
      running = false; if(timer) clearInterval(timer); timer = null;
      $("#ccGo").textContent = t("cc.start");
    }
    $("#ccTap").addEventListener("click", tap);
    $("#ccGo").addEventListener("click", () => running ? stopRun() : startRun());
    const key = e => { if(e.code === "Space" && running){ e.preventDefault(); tap(); } };
    document.addEventListener("keydown", key);
    cleanup = () => { stopRun(); document.removeEventListener("keydown", key); };
  }

  /* ================================================================
     4. מאמן קריאת תווים
     ================================================================ */
  const DIA = ["C","D","E","F","G","A","B"];
  function diaPos(note){                       // מיקום דיאטוני מוחלט
    const m = /^([A-G])(#?)(-?\d)$/.exec(normNote(note));
    return DIA.indexOf(m[1]) + 7 * parseInt(m[3], 10);
  }
  function staffSvg(note, clef){
    const bottom = clef === "bass" ? "G2" : "E4";     // הקו התחתון בכל מפתח
    const steps = diaPos(note) - diaPos(bottom);
    const yBottom = 78, gap = 12, y = yBottom - steps * (gap / 2);
    let s = `<svg viewBox="0 0 220 130" width="220" height="130" role="img"
      aria-label="${esc(t("read.staffAria"))}"><g stroke="currentColor" stroke-width="1.4">`;
    for(let i = 0; i < 5; i++) s += `<line x1="14" y1="${yBottom - i * gap}" x2="206" y2="${yBottom - i * gap}"/>`;
    s += "</g>";
    s += `<text x="26" y="${clef === "bass" ? 48 : 72}" font-size="${clef === "bass" ? 40 : 54}" fill="currentColor">${clef === "bass" ? "𝄢" : "𝄞"}</text>`;
    /* קווי עזר */
    for(let ly = yBottom + gap; ly <= y + 1; ly += gap)
      s += `<line x1="118" y1="${ly}" x2="162" y2="${ly}" stroke="currentColor" stroke-width="1.4"/>`;
    for(let ly = yBottom - 4 * gap - gap; ly >= y - 1; ly -= gap)
      s += `<line x1="118" y1="${ly}" x2="162" y2="${ly}" stroke="currentColor" stroke-width="1.4"/>`;
    s += `<ellipse cx="140" cy="${y}" rx="9" ry="6.6" fill="currentColor" transform="rotate(-18 140 ${y})"/>`;
    s += "</svg>";
    return s;
  }

  function reading(main){
    reset();
    let clef = "treble", cur = null, score = 0, total = 0, streak = 0;
    const RANGE = { treble: ["C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5"],
                    bass:   ["E2","F2","G2","A2","B2","C3","D3","E3","F3","G3","A3","B3","C4"] };

    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/tools" class="pill">${t("tools.all")}</a>
      <h1 style="margin-top:14px">🎼 ${t("read.h1")}</h1>
      <p class="lead">${t("read.lead")}</p>

      <div class="row">
        <span class="muted">${t("read.clef")}</span>
        <button class="chip on" data-clef="treble">${t("read.treble")}</button>
        <button class="chip" data-clef="bass">${t("read.bass")}</button>
      </div>

      <div class="card center" style="margin-top:16px">
        <div class="staffbox" id="rdStaff"></div>
        <p style="margin:10px 0 6px"><b>${t("read.q")}</b></p>
        <div class="row" id="rdAns" style="justify-content:center"></div>
        <div class="feedback" id="rdMsg" role="status" aria-live="polite" style="margin-top:10px"></div>
        <div class="between" style="margin-top:12px">
          <span class="pill" id="rdScore">${t("read.score", { s:0, t:0 })}</span>
          <span class="pill" id="rdStreak">${t("read.streak", { n:0 })}</span>
        </div>
      </div>

      <div class="tip" style="margin-top:16px">${t("read.tip")}</div>
    </div></section>`;

    const $ = id => main.querySelector(id);

    function next(){
      const pool = RANGE[clef];
      cur = pool[Math.floor(Math.random() * pool.length)];
      $("#rdStaff").innerHTML = staffSvg(cur, clef);
      $("#rdMsg").textContent = ""; $("#rdMsg").className = "feedback";
      /* בשפות שבהן שם התו הוא האות עצמה (אנגלית, גרמנית, אמהרית) אין טעם
         להציג "C C" – מוסיפים את האות הלטינית רק כשהיא מוסיפה מידע. */
      $("#rdAns").innerHTML = DIA.map(d => {
        const local = noteName(d + "4");
        const extra = local === d ? "" : `<small class="muted"> ${d}</small>`;
        return `<button class="chip nco ${noteColorClass(d + "4")}" data-n="${d}">${esc(local)}${extra}</button>`;
      }).join("");
      $("#rdAns").querySelectorAll("[data-n]").forEach(b => b.addEventListener("click", () => answer(b.dataset.n)));
    }
    function answer(n){
      total++;
      const correct = /^([A-G])/.exec(cur)[1];
      if(n === correct){
        score++; streak++;
        $("#rdMsg").className = "feedback ok"; $("#rdMsg").textContent = t("read.right");
        Audio1.ensure(); Audio1.playNote(cur, .6, "piano", .45);
        Store.addXp(2);
        setTimeout(next, 750);
      }else{
        streak = 0;
        $("#rdMsg").className = "feedback no";
        $("#rdMsg").textContent = t("read.wrong", { note: (noteName(correct + "4") === correct
            ? correct : noteName(correct + "4") + " (" + correct + ")") });
      }
      $("#rdScore").textContent = t("read.score", { s:score, t:total });
      $("#rdStreak").textContent = t("read.streak", { n:streak });
    }
    main.querySelectorAll("[data-clef]").forEach(b => b.addEventListener("click", () => {
      main.querySelectorAll("[data-clef]").forEach(x => x.classList.remove("on"));
      b.classList.add("on"); clef = b.dataset.clef; next();
    }));
    next();
  }

  /* ================================================================
     5. דוח התקדמות למורה / להורה
     ================================================================ */
  function report(main){
    reset();
    const st = Store.state;
    if(!Store.hasProgress()){
      main.innerHTML = `<section class="section"><div class="wrap narrow">
        <h1>${t("report.h1")}</h1><div class="tip">${t("report.empty")}</div>
        <a class="btn" href="#/instruments">${t("home.cta1")}</a></div></section>`;
      return;
    }
    const days = Object.keys(st.days).filter(d => st.days[d] > 0);
    const first = days.length ? days.sort()[0] : Store.today();
    const recent = st.journal.slice(0, 8);

    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <div class="row no-print" style="margin-bottom:14px">
        <a href="#/progress" class="pill">← ${t("prog.h1")}</a>
        <button class="btn btn-sm" id="rpPrint">${t("report.print")}</button>
      </div>

      <div class="report">
        <div class="report-head">
          <div><span class="brand-mark" aria-hidden="true">♪</span></div>
          <div>
            <h1 style="margin:0">${t("report.h1")}</h1>
            <small class="muted">${t("app.name")} · ${t("report.generated")} ${I18N.date(Date.now())}</small>
          </div>
        </div>

        <div class="field no-print" style="max-width:340px">
          <label for="rpName">${t("report.student")}</label>
          <input type="text" id="rpName" value="${esc(st.profile.name || "")}">
        </div>
        <p class="report-name"><b>${t("report.student")}:</b> <span id="rpNameOut">${esc(st.profile.name || "—")}</span></p>
        <p class="muted">${t("report.period")}: ${I18N.date(first)} – ${I18N.date(Date.now())}</p>

        <h2>${t("report.summary")}</h2>
        <table>
          <tr><td>${t("report.totalMin")}</td><td><b>${st.minutes}</b></td>
              <td>${t("report.days")}</td><td><b>${days.length}</b></td></tr>
          <tr><td>${t("report.streak")}</td><td><b>${st.streak}</b></td>
              <td>${t("report.lessonsDone")}</td><td><b>${Store.totalDone()}/${LESSONS.length}</b></td></tr>
          <tr><td>${t("report.repertoire")}</td><td><b>${Store.masteredCount()}</b></td>
              <td>${t("report.certs")}</td><td><b>${Object.keys(st.recitals).length}</b></td></tr>
        </table>

        <h2>${t("report.byInst")}</h2>
        <table>
          <tr><th>${t("nav.instruments")}</th><th>${t("prog.lessonsDone")}</th><th>${t("prog.repSongs")}</th><th>${t("rep.certs")}</th></tr>
          ${INSTRUMENTS.filter(i => Store.instProgress(i.id).done || Store.masteredCount(i.id)).map(i => {
            const p = Store.instProgress(i.id);
            return `<tr><td>${i.emoji} ${esc(I18N.instName(i.id))}</td>
              <td>${p.done}/${p.total}</td><td>${Store.masteredCount(i.id)}</td>
              <td>${st.recitals[i.id] ? "✔" : "—"}</td></tr>`;
          }).join("")}
        </table>

        ${Store.masteredCount() ? `<h2>${t("rep.h1")}</h2>
        <ol class="replist">${Store.masteredList().slice(0, 20).map(x =>
          `<li>${esc(I18N.songTitle(x.song))} <span class="muted">· ${t("common.level")} ${x.song.level}</span></li>`).join("")}</ol>` : ""}

        ${recent.length ? `<h2>${t("report.recent")}</h2>
        <table>${recent.map(j => `<tr><td>${I18N.date(j.at)}</td><td>${j.minutes}׳</td>
          <td>${esc(j.note || t("prog.practice"))}</td></tr>`).join("")}</table>` : ""}

        <h2>${t("report.notes")}</h2>
        <div class="report-notes">${t("report.notesPh")}</div>

        <p class="cert-note">${t("report.disclaimer")}</p>
      </div>
    </div></section>`;

    const nm = main.querySelector("#rpName");
    nm.addEventListener("input", () => {
      main.querySelector("#rpNameOut").textContent = nm.value || "—";
      Store.state.profile.name = nm.value; Store.save();
    });
    main.querySelector("#rpPrint").addEventListener("click", () => window.print());
  }

  return { backing, coach, changes, reading, report, reset, staffSvg };
})();
