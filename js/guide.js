/* ==========================================================================
   guide.js – תרגול מודרך: "לחץ כאן" → מקשיב → אומר אם זה נכון
   --------------------------------------------------------------------------
   שלושה מצבי בדיקה, לפי מה שהכלי מאפשר:
     • מיקרופון  – מקשיב לנגינה אמיתית (פסנתר אקוסטי, גיטרה, חלילית).
     • מגע       – לחיצה על המקלדת שעל המסך.
     • שילוב     – מה שמגיע ראשון, נחשב.
   ההשוואה היא לפי מחלקת גובה: גיטרה מצלצלת אוקטבה נמוך מהכתוב, וזה עדיין נכון.
   ========================================================================== */

const Guide = (() => {
  const esc = UI.esc;
  let cleanup = null;

  function reset(){
    if(cleanup){ try{ cleanup(); }catch(e){} cleanup = null; }
    Tuner.stop(); Audio1.stopSequence();
  }

  /* איזה כלי אפשר לבדוק במיקרופון: כלי שמפיק גובה צליל אחד ברור */
  const MIC_OK = { piano:true, guitar:true, ukulele:true, recorder:true, bass:true, drums:false };

  function pitchClass(note){
    const n = normNote(note);
    return n ? /^([A-G]#?)/.exec(n)[1] : null;
  }

  function view(main, instId){
    reset();
    const inst = INST[instId] || INST.piano;
    const songs = SONGS.filter(s => s.instruments.includes(inst.id));
    let song = songs[0];
    let idx = 0, hits = 0, tries = 0, listening = false;
    let stable = null, stableN = 0;

    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/tools" class="pill">${t("tools.all")}</a>
      <h1 style="margin-top:14px">🎯 ${t("guide.h1")}</h1>
      <p class="lead">${t("guide.lead")}</p>

      <div class="card">
        <div class="row" style="margin-bottom:10px">
          <span class="muted">${t("guide.inst")}</span>
          ${INSTRUMENTS.filter(i => MIC_OK[i.id]).map(i =>
            `<button class="chip ${i.id === inst.id ? "on" : ""}" data-gi="${i.id}">${i.emoji} ${esc(I18N.instName(i.id))}</button>`).join("")}
        </div>
        <div class="field">
          <label for="gSong">${t("guide.pick")}</label>
          <select id="gSong">${songs.map(s =>
            `<option value="${s.id}">${esc(I18N.songTitle(s))} — ${t("common.level")} ${s.level}</option>`).join("")}</select>
        </div>

        <div class="guide-target">
          <small class="muted">${t("guide.press")}</small>
          <div class="guide-note" id="gNote">—</div>
          <div class="muted" id="gPos"></div>
        </div>

        <div id="gBoard"></div>

        <div class="notestrip" id="gStrip" dir="ltr" aria-hidden="true"></div>
        <div class="bar" style="margin:12px 0"><span id="gBar" style="width:0%"></span></div>

        <div class="row between">
          <span class="pill">${t("guide.correct")}: <b id="gHit">0</b></span>
          <span class="pill">${t("pa.accuracy")}: <b id="gAcc">—</b></span>
          <span class="pill">${t("pa.best")}: <b id="gBest">—</b></span>
        </div>
        <div class="feedback" id="gMsg" role="status" aria-live="polite" style="margin-top:10px"></div>

        <div class="row" style="margin-top:14px">
          <button class="btn" id="gMic">🎤 ${t("guide.micOn")}</button>
          <button class="btn btn-ghost btn-sm" id="gHear">🔊 ${t("guide.hear")}</button>
          <button class="btn btn-ghost btn-sm" id="gSkip">${t("pa.skip")}</button>
          <button class="btn btn-ghost btn-sm" id="gReset">${t("pa.retry")}</button>
        </div>
        <div id="gMicNotice"></div>
        <p class="hint">${t("guide.hint")}</p>
      </div>

      <div class="tip" style="margin-top:16px">${t("guide.tip")}</div>
    </div></section>`;

    const $ = id => main.querySelector(id);

    /* ---------- לוח הנגינה: מקלדת לפסנתר, דיאגרמה לכלי מיתר ---------- */
    function board(){
      const box = $("#gBoard");
      box.innerHTML = "";
      if(inst.id === "piano"){
        const kb = UI.piano({ from:"C4", octaves:2, timbre:inst.timbre });
        kb.addEventListener("keyplay", e => check(e.detail.note, "touch"));
        box.appendChild(kb);
      }else{
        const p = document.createElement("p");
        p.className = "muted";
        p.textContent = t("guide.noBoard", { inst: I18N.instName(inst.id) });
        box.appendChild(p);
      }
    }

    const playable = () => song.notes.map((n, i) => ({ n:n[0], i })).filter(x => x.n);

    function skipRests(){ while(idx < song.notes.length && !song.notes[idx][0]) idx++; }

    function drawStrip(){
      $("#gStrip").innerHTML = song.notes.map(([n], i) =>
        `<span data-i="${i}" class="${n ? "nco " + noteColorClass(n) : ""}">${n ? noteHe(n) : "–"}</span>`).join("");
    }

    function mark(){
      const cur = song.notes[idx];
      const note = cur && cur[0];
      $("#gNote").textContent = note ? noteLabel(note) : "✓";
      $("#gNote").className = "guide-note" + (note ? " nco " + noteColorClass(note) : "");
      $("#gPos").textContent = note ? t("guide.of", { i: playable().filter(x => x.i < idx).length + 1, n: playable().length }) : "";
      $("#gStrip").querySelectorAll("span").forEach((s, i) => {
        s.classList.toggle("on", i === idx);
        s.classList.toggle("did", i < idx);
      });
      const el = $("#gStrip").querySelector(`[data-i="${idx}"]`);
      if(el) el.scrollIntoView({ block:"nearest", inline:"center" });
      /* מדגישים על המקלדת בדיוק את הקליד שצריך ללחוץ */
      main.querySelectorAll(".piano .key").forEach(k => k.classList.remove("hl"));
      if(note){
        const want = pitchClass(note);
        main.querySelectorAll(".piano .key").forEach(k => {
          if(pitchClass(k.dataset.note) === want) k.classList.add("hl");
        });
      }
      const done = playable().filter(x => x.i < idx).length;
      $("#gBar").style.width = Math.round(done / Math.max(1, playable().length) * 100) + "%";
    }

    function advance(ok){
      tries++;
      if(ok){
        hits++;
        $("#gMsg").className = "feedback ok";
        $("#gMsg").textContent = t("guide.yes");
      }
      $("#gHit").textContent = hits;
      $("#gAcc").textContent = Math.round(hits / Math.max(1, tries) * 100) + "%";
      idx++; skipRests();
      if(idx >= song.notes.length){ finish(); return; }
      mark();
    }

    function check(note, how){
      const cur = song.notes[idx];
      if(!cur || !cur[0]) return;
      const want = pitchClass(cur[0]), got = pitchClass(note);
      if(want === got){
        advance(true);
      }else{
        tries++;
        $("#gMsg").className = "feedback no";
        $("#gMsg").textContent = t("guide.no", { got: noteHe(note), want: noteHe(cur[0]) });
        $("#gAcc").textContent = Math.round(hits / Math.max(1, tries) * 100) + "%";
      }
    }

    function finish(){
      stopMic();
      const pct = Math.round(hits / Math.max(1, playable().length) * 100);
      const best = Store.setPlayAlongBest(song.id, pct);
      $("#gMsg").className = "feedback ok";
      $("#gMsg").textContent = t("guide.done", { pct });
      $("#gBest").textContent = Store.playAlongBest(song.id);
      if(best) App.toast(t("pa.newBest"));
      Store.logPractice(3, t("guide.h1") + " – " + I18N.songTitle(song));
      main.querySelectorAll(".piano .key").forEach(k => k.classList.remove("hl"));
    }

    /* ---------- מיקרופון ---------- */
    function onPitch(d){
      if(!listening || !d) { stableN = 0; return; }
      if(d.name === stable){ stableN++; } else { stable = d.name; stableN = 1; }
      /* דורשים כמה פריימים יציבים, אחרת רעש רקע נחשב לתו */
      if(stableN === 3 && Math.abs(d.cents) <= 45) check(d.label, "mic");
    }
    async function startMic(){
      Audio1.ensure();
      const res = await Mic.open(onPitch);
      if(!res.ok){
        const box = $("#gMicNotice");
        if(box){ box.innerHTML = ""; const d = document.createElement("div");
          d.className = "warnbox"; d.innerHTML = "<b>" + t("mic.title") + ":</b> " + (res.message || "");
          box.appendChild(d); }
        return;
      }
      listening = true;
      $("#gMic").textContent = "⏹ " + t("guide.micOff");
      $("#gMsg").className = "feedback";
      $("#gMsg").textContent = t("pa.listening");
    }
    function stopMic(){
      listening = false; Tuner.stop();
      const b = $("#gMic");
      if(b) b.textContent = "🎤 " + t("guide.micOn");
    }

    function restart(){
      idx = 0; hits = 0; tries = 0; stable = null; stableN = 0;
      skipRests(); drawStrip(); mark();
      $("#gHit").textContent = "0"; $("#gAcc").textContent = "—";
      $("#gMsg").textContent = ""; $("#gMsg").className = "feedback";
      $("#gBest").textContent = Store.playAlongBest(song.id) || "—";
    }

    /* ---------- חיווט ---------- */
    main.querySelectorAll("[data-gi]").forEach(b => b.addEventListener("click", () => {
      stopMic();
      main.querySelectorAll("[data-gi]").forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      location.hash = "#/guide/" + b.dataset.gi;
    }));
    $("#gSong").addEventListener("change", e => { song = SONG_BY_ID[e.target.value]; restart(); });
    $("#gMic").addEventListener("click", () => listening ? stopMic() : startMic());
    $("#gHear").addEventListener("click", () => {
      const cur = song.notes[idx];
      if(cur && cur[0]){ Audio1.ensure(); Audio1.playNote(cur[0], 1, inst.timbre, .5); }
    });
    $("#gSkip").addEventListener("click", () => advance(false));
    $("#gReset").addEventListener("click", restart);

    board();
    restart();
    cleanup = stopMic;
  }

  return { view, reset };
})();
