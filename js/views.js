/* ==========================================================================
   views.js – מסכי האפליקציה (רב-לשוני)
   ========================================================================== */

const Views = (() => {
  const esc = UI.esc;
  const el = (html) => { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; };
  const iname = id => esc(I18N.instName(id));

  /* ================= דף הבית ================= */
  function home(main){
    const st = Store.state;
    const started = Store.startedInstruments();
    const lp = Store.levelProgress();

    main.innerHTML = `
    <section class="section" id="installSlot" style="padding-bottom:0"></section>
    <section class="hero">
      <div class="wrap">
        <span class="badge">${t("home.badge")}</span>
        <h1>${t("home.h1")}</h1>
        <p class="lead">${t("home.lead")}</p>
        <div class="row" style="margin-top:22px">
          <a class="btn" href="#/instruments">${t("home.cta1")}</a>
          <a class="btn btn-ghost" href="#/songs">${t("home.cta2", { n:SONGS.length })}</a>
        </div>
        <div class="row stats-row" style="margin-top:18px">
          ${[[LESSONS.length, t("home.stat.lessons")],
             [SONGS.length, t("home.stat.songs")],
             [INSTRUMENTS.length, t("home.stat.instruments")],
             [APP.freeLessons * INSTRUMENTS.length, t("home.stat.freeLessons")]]
            .map(([n, l]) => `<span class="badge"><b>${n}</b> ${l}</span>`).join("")}
        </div>
      </div>
    </section>

    ${started.length ? `
    <section class="section"><div class="wrap">
      <div class="between"><h2>${t("home.continue")}</h2><a href="#/progress">${t("home.allProgress")}</a></div>
      <div class="grid g2" style="margin-top:14px">
        ${started.map(i => {
          const p = Store.instProgress(i.id), nx = Store.nextLesson(i.id);
          return `<a class="card" href="#/lesson/${nx.id}" style="text-decoration:none;color:inherit">
            <div class="between"><b>${i.emoji} ${iname(i.id)}</b><span class="pill">${p.done}/${p.total}</span></div>
            <div class="bar" style="margin:10px 0"><span style="width:${p.pct}%"></span></div>
            <div class="muted">${t("home.nextLesson")}: ${esc(I18N.lesson(nx).title)}</div>
          </a>`;
        }).join("")}
      </div>
      <div class="card" style="margin-top:16px">
        <div class="between">
          <div>${t("home.levelLine", { lv:lp.lv, xp:st.xp, streak:st.streak })}</div>
          <div style="min-width:200px;flex:1"><div class="bar"><span style="width:${lp.pct}%"></span></div></div>
        </div>
      </div>
    </div></section>` : ""}

    <section class="section"><div class="wrap">
      <div class="card" style="border-color:var(--accent)">
        <h2>${t("home.outcome.h")}</h2>
        <p class="muted">${t("home.outcome.p")}</p>
        <div class="grid g4" style="margin-top:14px">
          ${[["1️⃣", t("home.outcome.s1"), t("home.outcome.s1d")],
             ["2️⃣", t("home.outcome.s2"), t("home.outcome.s2d")],
             ["3️⃣", t("home.outcome.s3"), t("home.outcome.s3d")],
             ["4️⃣", t("home.outcome.s4"), t("home.outcome.s4d")]]
            .map(([i, ti, d]) => `<div><div style="font-size:1.6rem">${i}</div><b>${ti}</b>
              <p class="muted" style="margin:4px 0 0;font-size:.9rem">${d}</p></div>`).join("")}
        </div>
        <a class="btn btn-accent" style="margin-top:16px" href="#/repertoire">${t("home.outcome.cta")}</a>
      </div>
    </div></section>

    <section class="section"><div class="wrap">
      <h2>${t("home.choose")}</h2>
      <p class="muted">${t("home.chooseSub")}</p>
      <div class="grid g3" style="margin-top:16px">${INSTRUMENTS.map(card).join("")}</div>
    </div></section>

    <section class="section"><div class="wrap">
      <h2>${t("home.why")}</h2>
      <div class="grid g3" style="margin-top:14px">
        ${[["⏱️","why1"],["🔊","why2"],["📈","why3"],["🎚️","why4"],["♿","why5"],["⚖️","why6"]]
          .map(([i, k]) => `<div class="card"><div style="font-size:2rem">${i}</div>
            <h3>${t("home." + k)}</h3><p class="muted">${t("home." + k + "d")}</p></div>`).join("")}
      </div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="card center">
        <h2>${t("home.freeH")}</h2>
        <p class="muted">${t("home.freeP", { n:APP.freeLessons * INSTRUMENTS.length })}</p>
        <a class="btn btn-accent" href="#/pricing">${t("home.freeCta")}</a>
      </div>
    </div></section>`;

    installBar(main);
    document.addEventListener("pwa:available", () => installBar(main), { once:true });
  }

  function installBar(main){
    if(typeof Device === "undefined" || !Device.canInstall() || Device.isStandalone()) return;
    const slot = main.querySelector("#installSlot");
    if(!slot) return;
    slot.innerHTML = `<div class="wrap"><div class="install-bar">
      <div style="flex:1;min-width:200px"><b>${t("dev.installH")}</b>
        <span class="muted">${t("dev.installP")}</span></div>
      <button class="btn btn-sm" id="pwaBtn">${t("dev.installBtn")}</button>
    </div></div>`;
    slot.querySelector("#pwaBtn").addEventListener("click", async () => {
      const ok = await Device.promptInstall();
      if(ok) App.toast(t("dev.installed"));
      slot.innerHTML = "";
    });
  }

  function card(i){
    const p = Store.instProgress(i.id);
    return `<a class="inst-card" href="#/instrument/${i.id}">
      <div class="inst-emoji" aria-hidden="true">${i.emoji}</div>
      <h2 class="card-h">${iname(i.id)}</h2>
      <span class="pill">${esc(I18N.instTag(i.id))}</span>
      <p class="muted" style="margin:6px 0 0">${esc(I18N.instBlurb(i.id))}</p>
      ${p.done ? `<div class="bar" style="margin-top:8px"><span style="width:${p.pct}%"></span></div>
        <small class="muted">${t("insts.progressCount", { done:p.done, total:p.total })}</small>`
      : `<small class="muted">${t("insts.lessonsCount", { n:(LESSONS_BY_INST[i.id]||[]).length, free:APP.freeLessons })}</small>`}
    </a>`;
  }

  /* ================= רשימת כלים ================= */
  function instruments(main){
    main.innerHTML = `<section class="section"><div class="wrap">
      <h1>${t("insts.h1")}</h1>
      <p class="lead">${t("insts.lead", { n:LESSONS.length, free:APP.freeLessons })}</p>
      <div class="grid g3" style="margin-top:20px">${INSTRUMENTS.map(card).join("")}</div>
      <div class="card" style="margin-top:24px">
        <h2 class="card-h">${t("insts.helpH")}</h2>
        <div class="grid g2" style="margin-top:10px">
          ${[1,2,3,4].map(n => `<div><b>${t("insts.help" + n)}</b>
            <p class="muted">${t("insts.help" + n + "d")}</p></div>`).join("")}
        </div>
      </div>
    </div></section>`;
  }

  /* ================= דף כלי ================= */
  function instrument(main, id){
    const inst = INST[id];
    if(!inst) return notFound(main);
    const list = LESSONS_BY_INST[id] || [];
    const p = Store.instProgress(id);
    const pro = Store.isPro();
    const rec = Store.recitalStatus(id);
    const instSongs = SONGS.filter(s => s.instruments.includes(id)).length;

    main.innerHTML = `<section class="section"><div class="wrap">
      <a href="#/instruments" class="pill">${t("inst.allInstruments")}</a>
      <h1 style="margin:14px 0 .2em">${inst.emoji} ${iname(id)}</h1>
      <p class="lead">${esc(I18N.instBlurb(id))}</p>

      <div class="card" style="margin:16px 0">
        <div class="between">
          <b>${t("inst.yourProgress", { done:p.done, total:p.total })}</b>
          <span class="pill">${p.pct}%</span>
        </div>
        <div class="bar" style="margin-top:10px"><span style="width:${p.pct}%"></span></div>
      </div>

      ${!pro ? `<div class="tip block">${t("inst.freeNote", { free:APP.freeLessons })}</div>` : ""}

      <h2>${t("inst.curriculum")}</h2>
      <div class="grid" style="gap:10px;margin-top:12px">${list.map(lessonRow).join("")}</div>

      <h2 style="margin-top:32px">${t("inst.repH")}</h2>
      <div class="card">
        <div class="between">
          <div><b>${t("inst.repCount", { n:Store.masteredCount(id) })}</b>
            <div class="muted">${t("inst.repOf", { n:instSongs })}</div></div>
          <div class="row">
            <a class="btn btn-sm btn-ghost" href="#/songs">${t("inst.toSongs")}</a>
            <a class="btn btn-sm ${rec.ready ? "btn-accent" : "btn-ghost"}" href="#/recital/${id}">
              ${rec.granted ? t("rep.myCert") : rec.ready ? t("rep.toRecital") : t("rep.pathRecital")}</a>
          </div>
        </div>
        <div class="bar" style="margin:12px 0"><span style="width:${Math.min(100, Math.round(Store.masteredCount(id) / Store.RECITAL_REQ.songs * 100))}%"></span></div>
        <small class="muted">${t("inst.recitalNeed", { n:Store.RECITAL_REQ.songs })}</small>
      </div>

      <h3 style="margin-top:22px">${t("inst.recommended")}</h3>
      <div id="nextSongs" class="grid g2"></div>
    </div></section>`;

    const ns = main.querySelector("#nextSongs");
    Repertoire.nextSongs(id, 3).forEach(s => ns.appendChild(Repertoire.songCard(s, id)));
  }

  function lessonRow(l){
    const tl = I18N.lesson(l);
    const done = Store.isDone(l.id);
    const open = Store.isUnlocked(l);
    const href = open ? `#/lesson/${l.id}` : "#/pricing";
    return `<a class="lesson-item ${done ? "completed" : ""} ${open ? "" : "locked"}" href="${href}">
      <span class="lesson-num" aria-hidden="true">${done ? "✓" : open ? l.n : "🔒"}</span>
      <span class="lesson-meta">
        <b>${t("inst.lessonN", { n:l.n })}: ${esc(tl.title)}</b>
        <small>${esc(tl.goal)} · ${l.min} ${t("common.min")} · ${l.xp} ${t("common.pts")}</small>
      </span>
      <span class="pill ${done ? "done" : open ? "free" : "pro"}">${
        done ? t("common.done") : open ? (l.n <= APP.freeLessons ? t("common.free") : t("common.open")) : t("common.pro")}</span>
    </a>`;
  }

  /* ================= שיעור ================= */
  function lesson(main, id){
    const raw = LESSON_BY_ID[id];
    if(!raw) return notFound(main);
    if(!Store.isUnlocked(raw)) return paywall(main, raw);

    const l = I18N.lesson(raw);
    const inst = INST[raw.inst];
    const list = LESSONS_BY_INST[raw.inst];
    const prev = list.find(x => x.n === raw.n - 1), next = list.find(x => x.n === raw.n + 1);

    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/instrument/${raw.inst}" class="pill">← ${inst.emoji} ${iname(raw.inst)}</a>
      <h1 style="margin-top:14px">${t("inst.lessonN", { n:raw.n })}: ${esc(l.title)}</h1>
      <p class="lead"><b>${t("lesson.goal")}:</b> ${esc(l.goal)}</p>
      <div class="row"><span class="pill">⏱️ ${raw.min} ${t("common.min")}</span>
        <span class="pill">⭐ ${raw.xp} ${t("common.pts")}</span>
        ${Store.isDone(raw.id) ? `<span class="pill done">${t("common.done")}</span>` : ""}</div>
      <div id="blocks" style="margin-top:26px"></div>
      <div id="lessonSongs" style="margin-top:26px"></div>
      <div class="card" style="margin-top:26px">
        <h3>${t("lesson.doneH")}</h3>
        <p class="muted">${t("lesson.doneP")}</p>
        <div class="field">
          <label for="pmin">${t("lesson.minutesQ")}</label>
          <input type="number" id="pmin" min="1" max="180" value="${raw.min}" inputmode="numeric">
        </div>
        <div class="row">
          <button class="btn" id="doneBtn">${t("lesson.doneBtn")}</button>
          ${next ? `<a class="btn btn-ghost" href="#/lesson/${next.id}">${t("lesson.next")}</a>` : ""}
        </div>
      </div>
      <nav class="row" style="margin-top:20px" aria-label="${esc(t("lesson.nav"))}">
        ${prev ? `<a class="btn btn-ghost btn-sm" href="#/lesson/${prev.id}">${t("lesson.prev", { n:prev.n })}</a>` : ""}
        ${next ? `<a class="btn btn-ghost btn-sm" href="#/lesson/${next.id}">${t("lesson.nextN", { n:next.n })}</a>` : ""}
      </nav>
    </div></section>`;

    const holder = main.querySelector("#blocks");
    l.blocks.forEach(b => holder.appendChild(renderBlock(b)));

    const sg = main.querySelector("#lessonSongs");
    const picks = Repertoire.nextSongs(raw.inst, 2);
    if(picks.length){
      sg.innerHTML = `<h2>${t("lesson.songsH")}</h2><p class="muted">${t("lesson.songsP")}</p>`;
      const g = document.createElement("div");
      g.className = "grid g2";
      picks.forEach(s => g.appendChild(Repertoire.songCard(s, raw.inst)));
      sg.appendChild(g);
    }

    main.querySelector("#doneBtn").addEventListener("click", () => {
      const min = parseInt(main.querySelector("#pmin").value, 10) || raw.min;
      const first = Store.completeLesson(raw.id);
      Store.logPractice(min);
      App.toast(first ? t("lesson.congrats", { xp:raw.xp }) : t("lesson.updated"));
      UI.live(t("lesson.marked"));
      location.hash = next ? "#/lesson/" + next.id : "#/instrument/" + raw.inst;
    });
  }

  function renderBlock(b){
    switch(b.t){
      case "text":  return el(`<div class="block"><p>${b.html}</p></div>`);
      case "tip":   return el(`<div class="tip block"><p style="margin:0">💡 ${b.html}</p></div>`);
      case "warn":  return el(`<div class="warnbox block"><p style="margin:0">⚠️ ${b.html}</p></div>`);
      case "steps": return el(`<div class="block"><ol class="steps">${b.items.map(i => `<li>${i}</li>`).join("")}</ol></div>`);
      case "piano": return UI.piano(b);
      case "chord": return UI.chordDiagram(b.inst, b.id);
      case "melody":return UI.melody(b);
      case "recfing":{
        const box = document.createElement("div");
        box.className = "recgrid";
        b.notes.forEach(n => box.appendChild(UI.recorderChart(n)));
        return box;
      }
      case "rhythm":return UI.rhythm(b);
      case "drumpads": return UI.drumPads();
      case "quiz":  return quizBlock(b);
      case "task":  return taskBlock(b);
      default:      return el(`<div class="block"></div>`);
    }
  }

  function quizBlock(b){
    const nm = "q" + Math.random().toString(36).slice(2, 7);
    const wrap = el(`<div class="quiz block">
      <fieldset>
        <legend>❓ ${esc(b.q)}</legend>
        ${b.opts.map((o, i) => `<label class="opt"><input type="radio" name="${nm}" value="${i}"><span>${esc(o)}</span></label>`).join("")}
      </fieldset>
      <div class="feedback" role="status" aria-live="polite"></div>
    </div>`);
    const fb = wrap.querySelector(".feedback");
    wrap.querySelectorAll(".opt").forEach((opt, i) => {
      opt.addEventListener("click", () => {
        wrap.querySelectorAll(".opt").forEach(o => o.classList.remove("correct","wrong"));
        if(i === b.a){
          opt.classList.add("correct");
          fb.className = "feedback ok";
          fb.textContent = t("lesson.correct") + b.why;
          Store.state.quizStreak++; Store.save(); Store.checkBadges();
        }else{
          opt.classList.add("wrong");
          wrap.querySelectorAll(".opt")[b.a].classList.add("correct");
          fb.className = "feedback no";
          fb.textContent = t("lesson.wrong") + b.why;
          Store.state.quizStreak = 0; Store.save();
        }
      });
    });
    return wrap;
  }

  function taskBlock(b){
    return el(`<div class="card block">
      <div class="between"><b>${t("lesson.task", { n:b.min })}</b></div>
      <p style="margin:10px 0 0">${b.html}</p></div>`);
  }

  /* ================= חסימת תוכן ================= */
  function paywall(main, l){
    const tl = I18N.lesson(l);
    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <div class="card center">
        <div style="font-size:3rem">🔒</div>
        <h1>${t("inst.lessonN", { n:l.n })}: ${esc(tl.title)}</h1>
        <p class="lead">${t("lesson.lockedH")}. ${t("lesson.lockedP", { free:APP.freeLessons })}</p>
        <div class="row" style="justify-content:center">
          <a class="btn btn-accent" href="#/pricing">${t("lesson.unlockCta")}</a>
          <a class="btn btn-ghost" href="#/instrument/${l.inst}">${t("lesson.backCurriculum")}</a>
        </div>
      </div>
    </div></section>`;
  }

  function songs(main){ Repertoire.songs(main); }

  /* ================= התקדמות ================= */
  function progress(main){
    const st = Store.state, lp = Store.levelProgress(), w = Store.week();
    const maxMin = Math.max(10, ...w.map(d => d.min));

    main.innerHTML = `<section class="section"><div class="wrap">
      <h1>${t("prog.h1")}</h1>
      <div class="grid g4" style="margin:18px 0">
        ${[["⭐", t("prog.level"), lp.lv],
           ["🏆", t("prog.xp"), st.xp],
           ["🔥", t("prog.streak"), st.streak],
           ["⏱️", t("prog.minutes"), st.minutes],
           ["📚", t("prog.lessonsDone"), Store.totalDone()],
           ["🎖️", t("prog.badges"), st.badges.length + "/" + BADGES.length],
           ["🎼", t("prog.repSongs"), Store.masteredCount()],
           ["🏅", t("prog.certs"), Object.keys(st.recitals).length]]
          .map(([i, ti, v]) => `<div class="card center"><div style="font-size:1.7rem">${i}</div>
            <div class="price" style="font-size:1.7rem">${v}</div><small class="muted">${ti}</small></div>`).join("")}
      </div>

      <div class="card">
        <div class="between"><b>${t("prog.level")} ${lp.lv}</b>
          <span class="muted">${t("prog.toNext", { cur:lp.cur, need:lp.need })}</span></div>
        <div class="bar" style="margin-top:10px"><span style="width:${lp.pct}%"></span></div>
      </div>

      <h2 style="margin-top:28px">${t("prog.weekH")}</h2>
      <div class="card">
        <div class="row weekchart" role="img"
             aria-label="${esc(t("prog.weekAria"))}: ${w.map(d => d.date + " – " + d.min).join(", ")}">
          ${w.map(d => {
            const h = Math.round(d.min / maxMin * 110) + 6;
            const dn = new Date(d.date).toLocaleDateString(I18N.locale(), { weekday:"short" });
            return `<div style="flex:1;text-align:center">
              <div style="height:${h}px;background:linear-gradient(180deg,var(--brand2),var(--brand));border-radius:8px"></div>
              <small class="muted">${dn}<br>${d.min}</small></div>`;
          }).join("")}
        </div>
        <p class="muted" style="margin:10px 0 0">${t("prog.dailyGoal", { n:st.profile.dailyGoal })}
          ${(st.days[Store.today()] || 0) >= st.profile.dailyGoal ? t("prog.goalMet")
            : t("prog.goalLeft", { n:Math.max(0, st.profile.dailyGoal - (st.days[Store.today()] || 0)) })}</p>
      </div>

      <h2 style="margin-top:28px">${t("prog.byInst")}</h2>
      <div class="grid g2">
        ${INSTRUMENTS.map(i => {
          const p = Store.instProgress(i.id);
          return `<a class="card" href="#/instrument/${i.id}" style="text-decoration:none;color:inherit">
            <div class="between"><b>${i.emoji} ${iname(i.id)}</b><span class="pill">${p.done}/${p.total}</span></div>
            <div class="bar" style="margin-top:10px"><span style="width:${p.pct}%"></span></div></a>`;
        }).join("")}
      </div>

      <h2 style="margin-top:28px">${t("prog.repH")}</h2>
      <div class="card">
        <div class="between"><b>${t("prog.repKnow", { n:Store.masteredCount() })}</b>
          <a class="btn btn-sm btn-ghost" href="#/repertoire">${t("prog.fullList")}</a></div>
        <div class="row" style="margin-top:12px">
          ${SONG_LEVELS.map(l => `<span class="pill lvl${l.lvl}">${t("common.level")} ${l.lvl}: ${Store.masteredList().filter(x => x.song.level === l.lvl).length}</span>`).join("")}
        </div>
      </div>

      <h2 style="margin-top:28px">${t("prog.badges")}</h2>
      <div class="grid g4">
        ${BADGES.map(b => `<div class="badge-card ${st.badges.includes(b.id) ? "" : "locked"}">
          <div class="badge-ico" aria-hidden="true">${b.ico}</div>
          <b>${esc(I18N.badgeName(b))}</b><br><small class="muted">${esc(I18N.badgeDesc(b))}</small></div>`).join("")}
      </div>

      <h2 style="margin-top:28px">${t("prog.journalH")}</h2>
      <div class="card">
        <div class="field"><label for="jnote">${t("prog.journalLabel")}</label>
          <textarea id="jnote" rows="2" placeholder="${esc(t("prog.journalPh"))}"></textarea></div>
        <div class="row">
          <input type="number" id="jmin" value="10" min="1" max="240" style="max-width:120px" aria-label="${esc(t("common.min"))}">
          <button class="btn btn-sm" id="jadd">${t("prog.journalAdd")}</button>
        </div>
        <div id="jlist" style="margin-top:16px">
          ${st.journal.length ? st.journal.map(j => `<div class="lesson-item" style="cursor:default">
            <span class="lesson-num">${j.minutes}</span>
            <span class="lesson-meta"><b>${esc(j.note || t("prog.practice"))}</b>
              <small>${I18N.dateTime(j.at)}</small></span></div>`).join("")
            : `<p class="muted">${t("prog.journalEmpty")}</p>`}
        </div>
      </div>

      <h2 style="margin-top:28px">${t("prog.dataH")}</h2>
      <div class="card">
        <p class="muted">${t("prog.dataP")}</p>
        <div class="row">
          <button class="btn btn-ghost btn-sm" id="expBtn">${t("prog.export")}</button>
          <button class="btn btn-ghost btn-sm" id="impBtn">${t("prog.import")}</button>
          <button class="btn btn-ghost btn-sm" id="delBtn">${t("prog.delete")}</button>
        </div>
        <input type="file" id="impFile" accept="application/json" hidden
               aria-label="${esc(t("prog.import"))}">
        <div class="row" style="margin-top:14px">
          <a class="btn btn-sm" href="#/storage">🔒 ${t("st.h1")}</a>
          <a class="btn btn-sm btn-ghost" href="#/report">📄 ${t("report.h1")}</a>
        </div>
      </div>
    </div></section>`;

    main.querySelector("#jadd").addEventListener("click", () => {
      const note = main.querySelector("#jnote").value.trim();
      const min = parseInt(main.querySelector("#jmin").value, 10) || 10;
      Store.logPractice(min, note || t("prog.practice"));
      App.toast(t("prog.journalSaved"));
      App.render();
    });
    main.querySelector("#expBtn").addEventListener("click", () => {
      const blob = new Blob([Store.exportData()], { type:"application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "nagen-backup-" + Store.today() + ".json";
      a.click();
    });
    main.querySelector("#impBtn").addEventListener("click", () => main.querySelector("#impFile").click());
    main.querySelector("#impFile").addEventListener("change", e => {
      const f = e.target.files[0]; if(!f) return;
      const r = new FileReader();
      r.onload = () => { App.toast(Store.importData(r.result) ? t("prog.importOk") : t("prog.importBad")); App.render(); };
      r.readAsText(f);
    });
    main.querySelector("#delBtn").addEventListener("click", () => {
      App.confirm(t("prog.deleteH"), t("prog.deleteQ"),
        () => { Store.reset(); App.toast(t("prog.deleted")); location.hash = "#/"; });
    });
  }


  /* ================= הנתונים והגיבוי ================= */
  function storage(main){
    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/progress" class="pill">← ${t("prog.h1")}</a>
      <h1 style="margin-top:14px">🔒 ${t("st.h1")}</h1>
      <p class="lead">${t("st.lead")}</p>
      <div id="stBody"><p class="muted">${t("common.loading")}</p></div>

      <div class="card" style="margin-top:18px">
        <h2 style="margin-top:0">${t("st.cloudH")}</h2>
        <p class="muted" style="margin:0">${t("st.cloudP")}</p>
      </div>
      <p class="muted" style="margin-top:14px">
        <a href="#/legal/privacy">${t("legal.privacy.title")}</a></p>
    </div></section>`;

    function row(state, title, desc, actionHtml){
      const cls = state === true ? "ok" : (state === "partial" ? "warn" : "no");
      const lbl = state === true ? t("st.on") : (state === "partial" ? t("st.partial") : t("st.off"));
      return `<div class="card layer ${cls}">
        <div class="between">
          <b>${title}</b><span class="pill ${cls}">${lbl}</span>
        </div>
        <p class="muted" style="margin:8px 0 0">${desc}</p>
        ${actionHtml || ""}</div>`;
    }

    async function draw(){
      const h = await Backup.health();
      const body = main.querySelector("#stBody");
      if(!body) return;                       // המשתמש עבר לעמוד אחר בזמן הבדיקה
      const kb = h.usage === null ? "—" : (h.usage < 1048576
        ? Math.max(1, Math.round(h.usage / 1024)) + " KB"
        : (h.usage / 1048576).toFixed(1) + " MB");
      const d = h.daysSinceBackup;
      const last = !h.lastBackup ? t("st.never") : (d === 0 ? t("st.today") : t("st.daysAgo", { n:d }));

      const fileState = h.fileActive ? true : (h.filePending ? "partial" : false);
      let fileAction;
      if(!h.fileSupported)      fileAction = `<p class="warnbox" style="margin:10px 0 0">${t("st.fileNo")}</p>`;
      else if(h.fileActive)     fileAction = `<p style="margin:10px 0 6px"><b dir="ltr">${UI.esc(h.fileName || "")}</b></p>
                                   <div class="row"><button class="btn btn-sm btn-ghost" id="stFileStop">${t("st.fileStop")}</button></div>`;
      else if(h.filePending)    fileAction = `<div class="row" style="margin-top:10px">
                                   <button class="btn btn-sm" id="stFileGrant">${t("st.fileGrant")}</button>
                                   <button class="btn btn-sm btn-ghost" id="stFileStop">${t("st.fileStop")}</button></div>`;
      else                      fileAction = `<div class="row" style="margin-top:10px">
                                   <button class="btn btn-sm" id="stFilePick">${t("st.pickFile")}</button></div>`;

      body.innerHTML = `
        <div class="grid g3" style="margin-bottom:6px">
          <div class="card center"><small class="muted">${t("st.used")}</small>
            <div class="price" style="font-size:1.5rem" dir="ltr">${kb}</div></div>
          <div class="card center"><small class="muted">${t("st.lastBackup")}</small>
            <div class="price" style="font-size:1.5rem">${last}</div></div>
          <div class="card center"><small class="muted">${t("prog.repSongs")}</small>
            <div class="price" style="font-size:1.5rem">${Store.masteredCount()}</div></div>
        </div>

        <h2 style="margin-top:22px">${t("st.where")}</h2>

        ${row(h.persisted, "1 · " + t("st.l1"), t("st.l1d"),
          h.persisted || !h.canPersist ? "" :
          `<div class="row" style="margin-top:10px"><button class="btn btn-sm" id="stPersist">${t("st.askPersist")}</button></div>`)}

        ${row(h.indexedDB, "2 · " + t("st.l2"), t("st.l2d"), "")}

        ${row(fileState, "3 · " + t("st.l3"), t("st.l3d"), fileAction)}

        <div class="card" style="margin-top:6px">
          <b>${t("st.share")}</b>
          <p class="muted" style="margin:8px 0 10px">${t("st.shareHint")}</p>
          <div class="row">
            <button class="btn btn-sm" id="stShare">${h.canShare ? t("st.share") : t("prog.export")}</button>
            <button class="btn btn-sm btn-ghost" id="stImport">${t("prog.import")}</button>
          </div>
          <input type="file" id="stFile" accept="application/json" hidden
                   aria-label="${esc(t("prog.import"))}">
        </div>`;

      const on = (id, fn) => { const e = main.querySelector(id); if(e) e.addEventListener("click", fn); };
      on("#stPersist", async () => {
        const ok = await Backup.requestPersist();
        App.toast(ok ? t("st.persistOk") : t("st.persistNo"));
        draw();
      });
      on("#stFilePick",  async () => { if(await Backup.pickBackupFile()) App.toast(t("st.persistOk")); draw(); });
      on("#stFileGrant", async () => { await Backup.grantFilePermission(); draw(); });
      on("#stFileStop",  async () => { await Backup.stopFileBackup(); draw(); });
      on("#stShare", async () => {
        if(Backup.canShare()) await Backup.shareBackup(); else Backup.downloadBackup();
        App.toast(t("st.exported")); draw();
      });
      on("#stImport", () => main.querySelector("#stFile").click());
      const f = main.querySelector("#stFile");
      if(f) f.addEventListener("change", e => {
        const file = e.target.files[0]; if(!file) return;
        const r = new FileReader();
        r.onload = () => {
          const ok = Store.importData(r.result);
          App.toast(ok ? t("prog.importOk") : t("prog.importBad"));
          if(ok) Backup.mirror();
          draw();
        };
        r.readAsText(file);
      });
    }
    draw();
  }

  /* ================= מסלולים ================= */
  function pricing(main){
    const st = Store.state;
    main.innerHTML = `<section class="section"><div class="wrap">
      <h1>${t("pricing.h1")}</h1>
      <p class="lead">${t("pricing.lead", { free:APP.freeLessons, total:APP.freeLessons * INSTRUMENTS.length, all:LESSONS.length })}</p>

      ${st.plan ? `<div class="card" style="margin:18px 0;border-color:var(--ok)">
        <div class="between"><div><b>${t("pricing.active", { name:esc(st.plan.name) })}</b>
        <div class="muted">${t("pricing.ref", { id:esc(st.plan.invoice), date:I18N.date(st.plan.at) })}</div></div>
        <button class="btn btn-ghost btn-sm" id="cancelPlan">${t("pricing.cancel")}</button></div></div>` : ""}

      <div class="grid g3" style="margin-top:20px">
        ${PLANS.map(p => `<div class="plan ${p.best ? "best" : ""}">
          ${p.best ? `<span class="pill pro">${t("pricing.best")}</span>` : ""}
          <h2 style="margin:0">${esc(I18N.planName(p))}</h2>
          <div class="price">₪${p.price} <small>${esc(I18N.planPer(p))}</small></div>
          ${p.note ? `<span class="pill">${esc(I18N.has("plan." + p.id + ".note") ? t("plan." + p.id + ".note") : p.note)}</span>` : ""}
          <ul>${I18N.planPerks(p).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
          <a class="btn ${p.best ? "btn-accent" : ""}" href="#/checkout/${p.id}" style="margin-top:auto">${t("pricing.choose")}</a>
        </div>`).join("")}
      </div>

      <div class="warnbox" style="margin-top:24px">${t("pricing.demoNote")}</div>

      <h2 style="margin-top:30px">${t("pricing.freeForeverH")}</h2>
      <div class="grid g3">
        ${[1,2,3,4,5,6].map(n => `<div class="card">✅ ${t("pricing.ff" + n)}</div>`).join("")}
      </div>
    </div></section>`;

    const c = main.querySelector("#cancelPlan");
    if(c) c.addEventListener("click", () => App.confirm(t("pricing.cancel"), t("pricing.cancelQ"),
      () => { Store.cancelPlan(); App.toast(t("pricing.cancelled")); App.render(); }));
  }

  function checkout(main, planId){
    const p = PLANS.find(x => x.id === planId);
    if(!p) return notFound(main);
    let discount = 0;

    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <a href="#/pricing" class="pill">${t("co.back")}</a>
      <h1 style="margin-top:14px">${t("co.h1", { name:esc(I18N.planName(p)) })}</h1>
      <div class="warnbox">${t("co.demo")}</div>

      <div class="card" style="margin-top:18px">
        <div class="between"><b>${esc(I18N.planName(p))}</b><b id="sum">₪${p.price}</b></div>
        <div class="muted">${esc(I18N.planPer(p))}</div>
        <hr style="border:0;border-top:1px solid var(--line);margin:14px 0">

        <div class="field"><label for="cname">${t("co.name")}</label>
          <input type="text" id="cname" autocomplete="name" placeholder="${esc(t("co.namePh"))}"></div>
        <div class="field"><label for="cmail">${t("co.mail")}</label>
          <input type="email" id="cmail" autocomplete="email" placeholder="name@example.com" dir="ltr">
          <div class="hint">${t("co.mailHint")}</div></div>
        <div class="field"><label for="coupon">${t("co.coupon")}</label>
          <div class="row"><input type="text" id="coupon" placeholder="${esc(t("co.couponPh"))}" style="flex:1" dir="ltr">
            <button class="btn btn-ghost btn-sm" id="applyC">${t("co.apply")}</button></div>
          <div class="hint" id="cmsg"></div></div>

        <label class="opt" for="agree" style="margin-top:10px">
          <input type="checkbox" id="agree"><span>${t("co.agree")}</span></label>

        <button class="btn w100" id="payBtn" style="margin-top:14px">${t("co.pay")}</button>
        <p class="hint">${t("co.cancelRight")}</p>
      </div>
    </div></section>`;

    main.querySelector("#applyC").addEventListener("click", () => {
      const code = main.querySelector("#coupon").value.trim().toUpperCase();
      const msg = main.querySelector("#cmsg");
      if(COUPONS[code]){
        discount = COUPONS[code];
        main.querySelector("#sum").textContent = "₪" + Math.round(p.price * (100 - discount) / 100);
        msg.textContent = t("co.couponOk", { n:discount });
        msg.style.color = "var(--ok)";
      }else{
        discount = 0;
        main.querySelector("#sum").textContent = "₪" + p.price;
        msg.textContent = t("co.couponBad");
        msg.style.color = "var(--err)";
      }
    });

    main.querySelector("#payBtn").addEventListener("click", () => {
      if(!main.querySelector("#agree").checked){
        App.toast(t("co.mustAgree"));
        main.querySelector("#agree").focus();
        return;
      }
      const final = Math.round(p.price * (100 - discount) / 100);
      const plan = Store.activatePlan(p.id, final, discount ? main.querySelector("#coupon").value.trim().toUpperCase() : null);
      App.modal(`<h2>${t("co.okH")}</h2>
        <p>${t("co.okP", { n:LESSONS.length })}</p>
        <div class="card">
          <div class="between"><span>${t("co.plan")}</span><b>${esc(I18N.planName(p))}</b></div>
          <div class="between"><span>${t("co.amount")}</span><b>₪${final}</b></div>
          <div class="between"><span>${t("co.invoice")}</span><b dir="ltr">${esc(plan.invoice)}</b></div>
          <div class="between"><span>${t("co.date")}</span><b>${I18N.date(Date.now())}</b></div>
        </div>
        <p class="muted">${t("co.okNote")}</p>
        <a class="btn w100" href="#/instruments">${t("co.start")}</a>`);
    });
  }

  /* ================= שאלות נפוצות ================= */
  function faq(main){
    main.innerHTML = `<section class="section"><div class="wrap narrow">
      <h1>${t("faq.h1")}</h1>
      ${[1,2,3,4,5,6,7,8,9,10].map(n => `<details class="card" style="margin-bottom:10px">
        <summary style="cursor:pointer;font-weight:700">${esc(t("faq.q" + n))}</summary>
        <p style="margin-top:10px">${t("faq.a" + n)}</p></details>`).join("")}
      <div class="card" style="margin-top:20px">
        <h3>${t("faq.moreH")}</h3>
        <p>${esc(t("contact.name"))} · <a href="tel:${APP.contact.tel}" dir="ltr">${APP.contact.phone}</a> ·
        <a href="mailto:${APP.contact.email}" dir="ltr">${APP.contact.email}</a></p>
      </div>
    </div></section>`;
  }

  function notFound(main){
    main.innerHTML = `<section class="section"><div class="wrap center">
      <h1>${t("nf.h")}</h1><p class="muted">${t("nf.p")}</p>
      <a class="btn" href="#/">${t("nf.cta")}</a></div></section>`;
  }

  return { home, instruments, instrument, lesson, songs, progress, storage, pricing, checkout, faq, notFound };
})();
