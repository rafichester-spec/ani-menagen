/* ==========================================================================
   repertoire.js – ספריית השירים, הרפרטואר האישי, רסיטל הסיום והתעודה
   "תוצאה ביד": בסוף המסלול לתלמיד יש רשימת שירים שהוא באמת יודע לנגן,
   ועליה הוא נבחן ברסיטל סיום ומקבל תעודה להדפסה. (רב-לשוני)
   ========================================================================== */

const Repertoire = (() => {
  const esc = UI.esc;

  /* כותרת המשנה של השיר: השם הבין-לאומי, ורק כשהוא מוסיף מידע.
     קודם הוצג כאן השם העברי בכל שפה — כלומר משתמש רוסי ראה עברית. */
  function subTitle(song){
    const main = I18N.songTitle(song);
    return song.intl && song.intl !== main ? song.intl : "";
  }

  /* הזזת תו במספר חצאי-טונים – משמש לטרנספוזיציה */
  function shiftNote(name, k){
    if(!name || !k) return name;
    const n = normNote(name);
    if(!n) return name;
    const m = /^([A-G]#?)(-?\d)$/.exec(n);
    const abs = NOTE_ORDER.indexOf(m[1]) + (parseInt(m[2], 10) + 1) * 12 + k;
    if(abs < 12 || abs > 107) return name;
    return NOTE_ORDER[abs % 12] + (Math.floor(abs / 12) - 1);
  }
  function shiftMelody(notes, k){
    return k ? notes.map(([n, l]) => [n ? shiftNote(n, k) : n, l]) : notes;
  }

  /* ---------------- כרטיס שיר ---------------- */
  function songCard(song, instId){
    const inst = INST[instId] || INST.piano;
    const done = Store.isMastered(song.id);
    const card = document.createElement("article");
    card.className = "card song-card" + (done ? " mastered" : "");
    card.dataset.song = song.id;

    card.innerHTML = `
      <div class="between">
        <div style="min-width:0">
          <h2 class="song-title" style="margin:0 0 2px">${esc(I18N.songTitle(song))}</h2>
          <small class="muted">${esc(subTitle(song))}</small>
        </div>
        <span class="pill lvl${song.level}">${t("common.level")} ${song.level}</span>
      </div>
      <div class="row" style="margin:8px 0 4px">
        <span class="pill">${esc(I18N.styleName(song.style))}</span>
        <span class="pill">${song.bpm} BPM</span>
        <span class="pill">${song.notes.length} ${t("common.notes")}</span>
        ${song.chords ? `<span class="pill"><span dir="ltr">${esc(song.chords)}</span></span>` : ""}
      </div>`;

    const row = document.createElement("div");
    row.className = "row";
    row.style.marginTop = "10px";

    let speed = 1, playing = false, trans = 0, loop = false;
    const play = document.createElement("button");
    play.className = "btn btn-sm";
    play.textContent = t("common.play");
    const startPlay = () => {
      Audio1.ensure();
      playing = true; play.textContent = t("common.stop");
      Audio1.playSequence(shiftMelody(song.notes, trans), song.bpm * speed, inst.timbre,
        (n, i) => highlight(card, i),
        () => {
          Store.award("song");
          if(loop && playing){ setTimeout(() => { if(playing) startPlay(); }, 500); return; }
          playing = false; play.textContent = t("common.play");
        });
    };
    play.addEventListener("click", () => {
      if(playing){ Audio1.stopSequence(); playing = false; play.textContent = t("common.play"); return; }
      startPlay();
      UI.live(I18N.songTitle(song));
    });
    row.appendChild(play);

    [[.5,"×0.5"],[.75,"×0.75"],[1,"×1"]].forEach(([v, lbl]) => {
      const b = document.createElement("button");
      b.className = "chip" + (v === 1 ? " on" : "");
      b.textContent = lbl;
      b.setAttribute("aria-label", t("lesson.speed") + " " + lbl);
      b.addEventListener("click", () => {
        speed = v;
        row.querySelectorAll(".chip").forEach(c => c.classList.remove("on"));
        b.classList.add("on");
      });
      row.appendChild(b);
    });
    card.appendChild(row);

    /* טרנספוזיציה + לולאה */
    const ctl = document.createElement("div");
    ctl.className = "row songctl";
    ctl.style.marginTop = "8px";
    ctl.innerHTML = `
      <span class="muted" style="font-size:.85rem">${esc(t("song.transpose"))}</span>
      <button class="chip" data-tr="-1" aria-label="${esc(t("song.transpose"))} -1">−</button>
      <span class="pill" data-trout dir="ltr">0</span>
      <button class="chip" data-tr="1" aria-label="${esc(t("song.transpose"))} +1">+</button>
      <button class="chip" data-tr="0">${esc(t("song.reset"))}</button>
      <button class="chip" data-loop aria-pressed="false">🔁 ${esc(t("song.loop"))}</button>`;
    const out = ctl.querySelector("[data-trout]");
    ctl.querySelectorAll("[data-tr]").forEach(b => b.addEventListener("click", () => {
      const v = +b.dataset.tr;
      trans = v === 0 ? 0 : Math.max(-6, Math.min(6, trans + v));
      out.textContent = (trans > 0 ? "+" : "") + trans;
      out.classList.toggle("on", trans !== 0);
      UI.live(t("song.key") + " " + ((trans > 0 ? "+" : "") + trans));
    }));
    const lp = ctl.querySelector("[data-loop]");
    lp.addEventListener("click", () => {
      loop = !loop;
      lp.classList.toggle("on", loop);
      lp.setAttribute("aria-pressed", loop ? "true" : "false");
      UI.live(t("song.loop") + " – " + (loop ? t("a11y.on") : t("a11y.off")));
    });
    card.appendChild(ctl);
    const tip = document.createElement("small");
    tip.className = "muted";
    tip.style.display = "block";
    tip.style.margin = "6px 0 0";
    tip.textContent = t("song.transposeTip");
    card.appendChild(tip);

    /* קיצורי דרך לאימון */
    const train = document.createElement("div");
    train.className = "row";
    train.style.marginTop = "10px";
    train.innerHTML = `
      ${song.chords ? `<a class="btn btn-sm btn-ghost" href="#/tools/backing/${song.id}">${esc(t("song.backing"))}</a>` : ""}
      ${song.instruments.some(i => i !== "drums") ? `<a class="btn btn-sm btn-ghost" href="#/tools/coach/${song.id}">${esc(t("song.coach"))}</a>` : ""}`;
    if(train.children.length) card.appendChild(train);

    /* רצועת תווים */
    const strip = document.createElement("div");
    strip.className = "notestrip";
    strip.setAttribute("aria-hidden", "true");
    strip.setAttribute("dir", "ltr");
    song.notes.forEach(([n], i) => {
      const s = document.createElement("span");
      s.dataset.i = i;
      if(n) s.className = "nco " + noteColorClass(n);
      s.textContent = n ? noteHe(n) : "–";
      strip.appendChild(s);
    });
    card.appendChild(strip);

    /* סימון "אני יודע לנגן" */
    const master = document.createElement("button");
    master.className = "btn btn-sm " + (done ? "btn-accent" : "btn-ghost");
    master.style.marginTop = "10px";
    master.textContent = done ? t("songs.marked") : t("songs.mark");
    master.setAttribute("aria-pressed", done ? "true" : "false");
    master.addEventListener("click", () => {
      const now = Store.toggleMastered(song.id, instId);
      master.textContent = now ? t("songs.marked") : t("songs.mark");
      master.className = "btn btn-sm " + (now ? "btn-accent" : "btn-ghost");
      master.setAttribute("aria-pressed", now ? "true" : "false");
      card.classList.toggle("mastered", now);
      App.toast(now ? t("songs.addedToast", { name:I18N.songTitle(song) }) : t("songs.removedToast"));
      const c = document.getElementById("repCount");
      if(c) c.textContent = Store.masteredCount();
    });
    card.appendChild(master);

    /* פרטים לקורא מסך והדפסה */
    const det = document.createElement("details");
    det.style.marginTop = "10px";
    det.innerHTML = `<summary>${t("songs.detailsSummary")}</summary>
      <p style="font-size:.9rem">${song.notes.map(([n, l]) => (n ? noteHe(n) : t("lesson.rest")) + (l !== 1 ? " (" + l + ")" : "")).join(" · ")}</p>
      <p class="muted" style="font-size:.82rem">${t("common.source")}: ${esc(I18N.songOrigin(song))}
        ${song.url ? `· <a href="${esc(song.url)}" target="_blank" rel="noopener noreferrer">${t("songs.verify")} ↗</a>` : ""}</p>`;
    card.appendChild(det);

    return card;
  }

  function highlight(card, i){
    const strip = card.querySelector(".notestrip");
    if(!strip) return;
    strip.querySelectorAll("span").forEach(s => s.classList.remove("on"));
    const el = strip.querySelector('[data-i="' + i + '"]');
    if(el){ el.classList.add("on"); el.scrollIntoView({ block:"nearest", inline:"center" }); }
  }

  /* ---------------- ספריית השירים ---------------- */
  function songs(main){
    const st = { lvl:"all", inst:"all", style:"all", q:"", only:"all" };

    main.innerHTML = `<section class="section"><div class="wrap">
      <h1>${t("songs.h1", { n:SONGS.length })}</h1>
      <p class="lead">${t("songs.lead")}</p>

      <div class="card" style="margin:16px 0">
        <div class="between">
          <b>${t("songs.inRep", { n:'<span id="repCount">' + Store.masteredCount() + '</span>' })}</b>
          <a class="btn btn-sm btn-ghost" href="#/repertoire">${t("songs.toRep")}</a>
        </div>
      </div>

      <div class="card">
        <div class="field" style="margin-bottom:10px">
          <label for="sq">${t("songs.searchLabel")}</label>
          <input type="search" id="sq" placeholder="${esc(t("songs.searchPh"))}">
        </div>
        <div class="filters">
          <div class="frow"><span class="flbl">${t("songs.filterLevel")}</span>
            <button class="chip on" data-lvl="all">${t("common.all")}</button>
            ${SONG_LEVELS.map(l => `<button class="chip" data-lvl="${l.lvl}">${l.lvl} · ${esc(I18N.levelName(l.lvl))}</button>`).join("")}
          </div>
          <div class="frow"><span class="flbl">${t("songs.filterInst")}</span>
            <button class="chip on" data-inst="all">${t("common.all")}</button>
            ${INSTRUMENTS.map(i => `<button class="chip" data-inst="${i.id}">${i.emoji} ${esc(I18N.instName(i.id))}</button>`).join("")}
          </div>
          <div class="frow"><span class="flbl">${t("songs.filterStyle")}</span>
            <button class="chip on" data-style="all">${t("common.all")}</button>
            ${Object.keys(SONG_STYLES).map(k => `<button class="chip" data-style="${k}">${esc(I18N.styleName(k))}</button>`).join("")}
          </div>
          <div class="frow"><span class="flbl">${t("songs.filterShow")}</span>
            <button class="chip on" data-only="all">${t("common.all")}</button>
            <button class="chip" data-only="todo">${t("songs.showTodo")}</button>
            <button class="chip" data-only="done">${t("songs.showDone")}</button>
          </div>
        </div>
      </div>

      <p id="cnt" class="muted" style="margin:16px 0 8px" role="status" aria-live="polite"></p>
      <div id="songGrid" class="grid g2"></div>
      <div class="center" style="margin-top:20px">
        <button class="btn btn-ghost" id="moreBtn" hidden></button>
      </div>
    </div></section>`;

    const grid = main.querySelector("#songGrid"), cnt = main.querySelector("#cnt");
    const moreBtn = main.querySelector("#moreBtn");
    const PAGE = (typeof Device !== "undefined") ? Device.songsPerPage() : 24;
    let shown = PAGE, current = [];

    function paint(){
      grid.innerHTML = "";
      const instId = st.inst === "all" ? "piano" : st.inst;
      current.slice(0, shown).forEach(s => grid.appendChild(songCard(s, instId)));
      moreBtn.hidden = current.length <= shown;
      moreBtn.textContent = t("songs.more", { n:Math.max(0, current.length - shown) });
    }
    moreBtn.addEventListener("click", () => { shown += PAGE; paint(); UI.live(t("songs.moreAdded")); });

    function draw(){
      shown = PAGE;
      const q = st.q.trim().toLowerCase();
      const list = SONGS.filter(s =>
        (st.lvl === "all" || s.level === +st.lvl) &&
        (st.inst === "all" || s.instruments.includes(st.inst)) &&
        (st.style === "all" || s.style === st.style) &&
        (st.only === "all" || (st.only === "done") === Store.isMastered(s.id)) &&
        (!q || (s.title + " " + s.intl + " " + s.src + " " + (SONG_SRC_EN[s.id] || "") + " " + I18N.styleName(s.style)).toLowerCase().includes(q))
      ).sort((a, b) => a.level - b.level);

      cnt.textContent = list.length ? t("songs.found", { n:list.length }) : t("songs.none");
      current = list;
      paint();
    }
    const bind = (attr, key) => main.querySelectorAll("[data-" + attr + "]").forEach(b => b.addEventListener("click", () => {
      main.querySelectorAll("[data-" + attr + "]").forEach(x => x.classList.remove("on"));
      b.classList.add("on"); st[key] = b.dataset[attr]; draw();
    }));
    bind("lvl", "lvl"); bind("inst", "inst"); bind("style", "style"); bind("only", "only");
    main.querySelector("#sq").addEventListener("input", e => { st.q = e.target.value; draw(); });
    draw();
  }

  /* ---------------- הרפרטואר שלי ---------------- */
  function mine(main){
    const all = Store.masteredList();
    const byInst = {};
    all.forEach(x => { (byInst[x.inst] = byInst[x.inst] || []).push(x); });

    main.innerHTML = `<section class="section"><div class="wrap">
      <h1>${t("rep.h1")}</h1>
      <p class="lead">${t("rep.lead")}</p>

      <div class="grid g4" style="margin:18px 0">
        <div class="card center"><div class="price">${all.length}</div><small class="muted">${t("rep.songs")}</small></div>
        <div class="card center"><div class="price">${Object.keys(byInst).length}</div><small class="muted">${t("rep.insts")}</small></div>
        <div class="card center"><div class="price">${all.length ? Math.max(...all.map(x => x.song.level)) : 0}</div><small class="muted">${t("rep.topLevel")}</small></div>
        <div class="card center"><div class="price">${Object.keys(Store.state.recitals).length}</div><small class="muted">${t("rep.certs")}</small></div>
      </div>

      ${all.length ? "" : `<div class="tip">${t("rep.empty")}</div>`}

      ${Object.entries(byInst).map(([instId, list]) => {
        const inst = INST[instId] || { emoji:"🎵" };
        const rs = Store.recitalStatus(instId);
        return `<div class="card block">
          <div class="between">
            <h2 style="margin:0">${inst.emoji} ${t("rep.instSongs", { inst:esc(I18N.instName(instId) || instId), n:list.length })}</h2>
            <a class="btn btn-sm ${rs.ready ? "btn-accent" : "btn-ghost"}" href="#/recital/${instId}">
              ${rs.granted ? t("rep.myCert") : rs.ready ? t("rep.toRecital") : t("rep.pathRecital")}</a>
          </div>
          <ol class="replist">
            ${list.map(x => `<li><b>${esc(I18N.songTitle(x.song))}</b>
              <span class="pill lvl${x.song.level}">${t("common.level")} ${x.song.level}</span>
              <small class="muted">${esc(I18N.songSrc(x.song))}</small></li>`).join("")}
          </ol>
        </div>`;
      }).join("")}

      <div class="card">
        <h3>${t("rep.pathH")}</h3>
        <div class="grid g3" style="margin-top:12px">
          ${INSTRUMENTS.map(i => {
            const rs = Store.recitalStatus(i.id);
            const okCount = rs.checks.filter(c => c.ok).length;
            return `<a class="inst-card" href="#/recital/${i.id}">
              <div class="inst-emoji" aria-hidden="true">${i.emoji}</div>
              <b>${esc(I18N.instName(i.id))}</b>
              <div class="bar" style="margin-top:8px"><span style="width:${Math.round(okCount / 3 * 100)}%"></span></div>
              <small class="muted">${rs.granted ? t("rep.certIssued") : t("rep.condsDone", { n:okCount })}</small>
            </a>`;
          }).join("")}
        </div>
      </div>

      <div class="row" style="margin-top:16px">
        <button class="btn btn-ghost btn-sm" id="printRep">${t("rep.printBtn")}</button>
      </div>
    </div></section>`;
    main.querySelector("#printRep").addEventListener("click", () => window.print());
  }

  /* ---------------- רסיטל סיום ---------------- */
  function recital(main, instId){
    const inst = INST[instId];
    if(!inst) return Views.notFound(main);
    const rs = Store.recitalStatus(instId);
    const list = Store.masteredList(instId);
    const LBL = {
      lessons: [t("recital.cond.lessons"), t("recital.cond.lessonsD", { have:rs.checks[0].have, need:rs.checks[0].need })],
      songs:   [t("recital.cond.songs"),   t("recital.cond.songsD",   { have:rs.checks[1].have, need:rs.checks[1].need })],
      level:   [t("recital.cond.level"),   rs.checks[2].have ? t("recital.cond.levelD", { have:rs.checks[2].have }) : t("recital.cond.levelNone")]
    };

    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/repertoire" class="pill">← ${t("rep.h1")}</a>
      <h1 style="margin-top:14px">${inst.emoji} ${t("recital.h1", { inst:esc(I18N.instName(instId)) })}</h1>
      <p class="lead">${t("recital.lead")}</p>

      <div class="card block">
        <h2>${t("recital.condsH")}</h2>
        <ul class="checklist">
          ${rs.checks.map(c => `<li class="${c.ok ? "ok" : ""}">
            <span aria-hidden="true">${c.ok ? "✅" : "⬜"}</span>
            <span><b>${LBL[c.id][0]}</b><br><small class="muted">${LBL[c.id][1]}</small></span></li>`).join("")}
        </ul>
        ${rs.ready ? "" : `<div class="tip" style="margin-top:14px">${t("recital.notYetTip", { inst:instId })}</div>`}
      </div>

      <div class="card block">
        <h2>${t("recital.structH")}</h2>
        <ol class="steps">${[1,2,3,4,5].map(n => `<li>${t("recital.st" + n)}</li>`).join("")}</ol>
        <div class="warnbox" style="margin-top:12px">${t("recital.rule")}</div>
      </div>

      ${list.length ? `<div class="card block">
        <h2>${t("recital.programH", { n:list.length })}</h2>
        <ol class="replist">
          ${list.map(x => `<li><b>${esc(I18N.songTitle(x.song))}</b>
            <span class="pill lvl${x.song.level}">${t("common.level")} ${x.song.level}</span></li>`).join("")}
        </ol>
        <button class="btn btn-sm" id="playAll" style="margin-top:12px">${t("recital.playAll")}</button>
      </div>` : ""}

      <div class="card center">
        ${rs.granted
          ? `<h2>${t("recital.gotCert")}</h2>
             <p class="muted">${t("recital.certDate", { date:I18N.date(rs.cert.at), id:esc(rs.cert.id) })}</p>
             <a class="btn btn-accent" href="#/certificate/${instId}">${t("recital.viewCert")}</a>`
          : rs.ready
            ? `<h2>${t("recital.readyH")}</h2>
               <p class="muted">${t("recital.readyP")}</p>
               <div class="field" style="max-width:340px;margin-inline:auto;text-align:start">
                 <label for="certName">${t("recital.nameLabel")}</label>
                 <input type="text" id="certName" value="${esc(Store.state.profile.name || "")}" placeholder="${esc(t("recital.namePh"))}">
               </div>
               <button class="btn btn-accent" id="grantBtn">${t("recital.grantBtn")}</button>`
            : `<h2>${t("recital.notYetH")}</h2><p class="muted">${t("recital.notYetP")}</p>
               <a class="btn btn-ghost" href="#/instrument/${instId}">${t("recital.backLessons")}</a>`}
      </div>
    </div></section>`;

    const pa = main.querySelector("#playAll");
    if(pa) pa.addEventListener("click", () => {
      Audio1.ensure();
      let delay = 0;
      list.forEach(x => {
        setTimeout(() => Audio1.playSequence(x.song.notes, x.song.bpm, inst.timbre), delay);
        delay += x.song.notes.reduce((a, [, l]) => a + l, 0) * (60000 / x.song.bpm) + 900;
      });
      App.toast(t("recital.playing"));
    });

    const gb = main.querySelector("#grantBtn");
    if(gb) gb.addEventListener("click", () => {
      const nm = (main.querySelector("#certName").value || "").trim();
      if(nm){ Store.state.profile.name = nm; Store.save(); }
      Store.grantRecital(instId, nm);
      App.toast(t("recital.granted"));
      location.hash = "#/certificate/" + instId;
    });
  }

  /* ---------------- תעודת סיום ---------------- */
  function certificate(main, instId){
    const inst = INST[instId];
    const cert = Store.state.recitals[instId];
    if(!inst) return Views.notFound(main);
    if(!cert){ location.hash = "#/recital/" + instId; return; }

    const list = (cert.songs || []).map(id => SONG_BY_ID[id]).filter(Boolean);
    const topLvl = list.length ? Math.max(...list.map(s => s.level)) : 1;

    main.innerHTML = `<section class="section"><div class="wrap" style="max-width:880px">
      <div class="row no-print" style="margin-bottom:14px">
        <a href="#/repertoire" class="pill">← ${t("rep.h1")}</a>
        <button class="btn btn-sm" id="printCert">${t("common.print")}</button>
      </div>

      <div class="cert">
        <div class="cert-frame">
          <div class="cert-top">
            <span class="cert-mark" aria-hidden="true">♪</span>
            <div><b>${t("app.name")}</b><br><small>${t("app.tagline")}</small></div>
          </div>
          <h1 class="cert-title">${t("cert.title")}</h1>
          <p class="cert-sub">${t("cert.sub1")}</p>
          <p class="cert-name">${esc(cert.name || t("cert.student"))}</p>
          <p class="cert-sub">${t("cert.sub2")}</p>
          <p class="cert-inst">${inst.emoji} ${esc(I18N.instName(instId))}</p>
          <p class="cert-body">${t("cert.body", { lessons:(LESSONS_BY_INST[instId] || []).length, songs:list.length })}</p>

          <div class="cert-songs">
            <b>${t("cert.repertoire")}</b>
            <ol>${list.map(s => `<li>${esc(I18N.songTitle(s))}
              <span class="muted">· ${t("common.level")} ${s.level}</span></li>`).join("")}</ol>
          </div>

          <div class="cert-foot">
            <div><small>${t("cert.date")}</small><br><b>${I18N.date(cert.at)}</b></div>
            <div><small>${t("cert.ref")}</small><br><b dir="ltr">${esc(cert.id)}</b></div>
            <div><small>${t("cert.minutes")}</small><br><b>${Store.state.minutes}</b></div>
          </div>
          <p class="cert-note">${t("cert.note")}</p>
        </div>
      </div>

      <div class="card no-print" style="margin-top:20px">
        <h3>${t("cert.nextH")}</h3>
        <ul>
          <li>${t("cert.next1")}</li>
          <li>${t("cert.next2", { lvl:Math.min(5, topLvl + 1) })}</li>
          <li>${t("cert.next3")}</li>
          <li>${t("cert.next4")}</li>
        </ul>
      </div>
    </div></section>`;
    main.querySelector("#printCert").addEventListener("click", () => window.print());
  }

  /* ---------------- שירים מומלצים לכלי ---------------- */
  function nextSongs(instId, max){
    const done = Store.instProgress(instId);
    const targetLvl = done.pct >= 80 ? 4 : done.pct >= 50 ? 3 : done.pct >= 25 ? 2 : 1;
    return SONGS
      .filter(s => s.instruments.includes(instId) && !Store.isMastered(s.id) && s.level <= targetLvl)
      .sort((a, b) => b.level - a.level)
      .slice(0, max || 3);
  }

  return { songs, mine, recital, certificate, songCard, nextSongs };
})();
