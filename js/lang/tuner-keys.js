/* מפתחות המכוון לפי מיתרים – בעשר השפות */
(function(){
const K = {
he:{
"tuner.mutedWarn":"הצליל מושתק — הפעל אותו כדי לשמוע את צליל הייחוס",
"tuner.lead":"בחר כלי, ואז כוון מיתר-מיתר. אפשר לכוון באוזן מול צליל ייחוס מתמשך, או לתת למיקרופון לבדוק אותך.",
"tuner.standard":"כיוון סטנדרטי","tuner.byString":"כיוון לפי מיתרים",
"tuner.droneHint":"לחיצה על מיתר מפעילה צליל ייחוס שממשיך לצלצל. נגן את המיתר שלך והשווה – כשהשניים מתמזגים בלי \“גלים\”, המיתר מכוון. לחיצה נוספת עוצרת.",
"tuner.stringN":"מיתר {n} · {note}","tuner.offAny":"רחוק מכל מיתר – בדוק שאתה על המיתר הנכון",
"tuner.stringOk":"מיתר {n} מכוון ✓",
"tuner.tighten":"נמוך מדי – הדק את המיתר ({c} סנט)",
"tuner.loosen":"גבוה מדי – הרפה את המיתר ({c} סנט)",
"tuner.noMicTip":"<b>אין מיקרופון או שסירבת להרשאה?</b> אפשר לכוון לגמרי באוזן: לחץ על מיתר למעלה, הקשב לצליל הייחוס, ונגן את המיתר שלך לצדו. אם שומעים \“פעימות\” שמאיטות ככל שמתקרבים – אתה בכיוון הנכון.",
"tuner.moreLink":"עוד על כיווני גיטרה (ויקיפדיה)"
},
en:{
"tuner.mutedWarn":"Sound is muted — turn it on to hear the reference tone",
"tuner.lead":"Pick an instrument, then tune string by string. Tune by ear against a sustained reference tone, or let the microphone check you.",
"tuner.standard":"Standard tuning","tuner.byString":"Tune string by string",
"tuner.droneHint":"Tapping a string starts a reference tone that keeps ringing. Play your string alongside it — when the two merge with no \“beating\”, the string is in tune. Tap again to stop.",
"tuner.stringN":"String {n} · {note}","tuner.offAny":"Far from any string — check you are on the right one",
"tuner.stringOk":"String {n} is in tune ✓",
"tuner.tighten":"Too low — tighten the string ({c} cents)",
"tuner.loosen":"Too high — loosen the string ({c} cents)",
"tuner.noMicTip":"<b>No microphone, or you declined the permission?</b> You can tune entirely by ear: tap a string above, listen to the reference tone, and play your string next to it. If you hear \“beats\” that slow down as you get closer, you are going the right way.",
"tuner.moreLink":"More on guitar tunings (Wikipedia)"
},
ar:{
"tuner.mutedWarn":"الصوت مكتوم — شغّله لسماع النغمة المرجعية",
"tuner.lead":"اختر آلة، ثم اضبط وتراً وتراً. يمكنك الضبط بالأذن مقابل نغمة مرجعية مستمرة، أو أن تدع الميكروفون يفحصك.",
"tuner.standard":"الضبط القياسي","tuner.byString":"الضبط وتراً وتراً",
"tuner.droneHint":"الضغط على وتر يشغّل نغمة مرجعية تستمر بالرنين. اعزف وترك بجانبها — وعندما يندمج الصوتان بلا \“تموّج\” يكون الوتر مضبوطاً. اضغط ثانية للإيقاف.",
"tuner.stringN":"الوتر {n} · {note}","tuner.offAny":"بعيد عن كل الأوتار — تأكّد أنك على الوتر الصحيح",
"tuner.stringOk":"الوتر {n} مضبوط ✓",
"tuner.tighten":"منخفض جداً — شدّ الوتر ({c} سنت)",
"tuner.loosen":"مرتفع جداً — أرخِ الوتر ({c} سنت)",
"tuner.noMicTip":"<b>لا يوجد ميكروفون أو رفضت الإذن؟</b> يمكنك الضبط بالأذن تماماً: اضغط على وتر في الأعلى، استمع إلى النغمة المرجعية، واعزف وترك بجانبها. إذا سمعت \“نبضات\” تتباطأ كلما اقتربت، فأنت في الاتجاه الصحيح.",
"tuner.moreLink":"المزيد عن ضبط الغيتار (ويكيبيديا)"
},
ru:{
"tuner.mutedWarn":"Звук выключен — включите его, чтобы услышать эталонный тон",
"tuner.lead":"Выберите инструмент и настраивайте струну за струной. Настраивайте на слух по непрерывному эталонному тону или доверьте проверку микрофону.",
"tuner.standard":"Стандартный строй","tuner.byString":"Настройка по струнам",
"tuner.droneHint":"Нажатие на струну включает эталонный тон, который звучит непрерывно. Играйте свою струну рядом — когда звуки сливаются без \“биений\”, струна настроена. Нажмите ещё раз, чтобы остановить.",
"tuner.stringN":"Струна {n} · {note}","tuner.offAny":"Далеко от любой струны — проверьте, ту ли струну вы играете",
"tuner.stringOk":"Струна {n} настроена ✓",
"tuner.tighten":"Слишком низко — подтяните струну ({c} центов)",
"tuner.loosen":"Слишком высоко — ослабьте струну ({c} центов)",
"tuner.noMicTip":"<b>Нет микрофона или вы отказали в доступе?</b> Настроить можно полностью на слух: нажмите струну выше, послушайте эталонный тон и сыграйте свою струну рядом. Если слышны \“биения\”, которые замедляются по мере приближения, — вы идёте верно.",
"tuner.moreLink":"Подробнее о строях гитары (Википедия)"
},
fr:{
"tuner.mutedWarn":"Le son est coupé — activez-le pour entendre la note de référence",
"tuner.lead":"Choisissez un instrument, puis accordez corde par corde. Accordez à l'oreille sur une note de référence tenue, ou laissez le microphone vous vérifier.",
"tuner.standard":"Accordage standard","tuner.byString":"Accorder corde par corde",
"tuner.droneHint":"Toucher une corde lance une note de référence qui continue de sonner. Jouez votre corde à côté — quand les deux fusionnent sans \“battements\”, la corde est juste. Touchez à nouveau pour arrêter.",
"tuner.stringN":"Corde {n} · {note}","tuner.offAny":"Loin de toute corde — vérifiez que vous êtes sur la bonne",
"tuner.stringOk":"La corde {n} est juste ✓",
"tuner.tighten":"Trop bas — tendez la corde ({c} cents)",
"tuner.loosen":"Trop haut — détendez la corde ({c} cents)",
"tuner.noMicTip":"<b>Pas de micro, ou vous avez refusé l'autorisation ?</b> Vous pouvez accorder entièrement à l'oreille : touchez une corde ci-dessus, écoutez la note de référence et jouez votre corde à côté. Si vous entendez des \“battements\” qui ralentissent à mesure que vous approchez, vous allez dans le bon sens.",
"tuner.moreLink":"En savoir plus sur les accordages de guitare (Wikipédia)"
},
es:{
"tuner.mutedWarn":"El sonido está silenciado: actívalo para oír el tono de referencia",
"tuner.lead":"Elige un instrumento y afina cuerda por cuerda. Afina de oído con un tono de referencia sostenido, o deja que el micrófono te compruebe.",
"tuner.standard":"Afinación estándar","tuner.byString":"Afinar cuerda por cuerda",
"tuner.droneHint":"Pulsar una cuerda inicia un tono de referencia que sigue sonando. Toca tu cuerda junto a él: cuando los dos se funden sin \“batidos\”, la cuerda está afinada. Pulsa otra vez para parar.",
"tuner.stringN":"Cuerda {n} · {note}","tuner.offAny":"Lejos de cualquier cuerda: comprueba que estás en la correcta",
"tuner.stringOk":"La cuerda {n} está afinada ✓",
"tuner.tighten":"Demasiado grave: tensa la cuerda ({c} centésimas)",
"tuner.loosen":"Demasiado aguda: afloja la cuerda ({c} centésimas)",
"tuner.noMicTip":"<b>¿Sin micrófono, o rechazaste el permiso?</b> Puedes afinar totalmente de oído: pulsa una cuerda arriba, escucha el tono de referencia y toca tu cuerda al lado. Si oyes \“batidos\” que se ralentizan al acercarte, vas por buen camino.",
"tuner.moreLink":"Más sobre afinaciones de guitarra (Wikipedia)"
},
de:{
"tuner.mutedWarn":"Der Ton ist stumm — schalte ihn ein, um den Referenzton zu hören",
"tuner.lead":"Wähle ein Instrument und stimme Saite für Saite. Stimme nach Gehör gegen einen gehaltenen Referenzton, oder lass dich vom Mikrofon prüfen.",
"tuner.standard":"Standardstimmung","tuner.byString":"Saite für Saite stimmen",
"tuner.droneHint":"Ein Tippen auf eine Saite startet einen Referenzton, der weiterklingt. Spiel deine Saite daneben — wenn beide ohne \“Schwebungen\” verschmelzen, ist die Saite gestimmt. Nochmals tippen stoppt ihn.",
"tuner.stringN":"Saite {n} · {note}","tuner.offAny":"Weit von jeder Saite entfernt — prüfe, ob du auf der richtigen bist",
"tuner.stringOk":"Saite {n} ist gestimmt ✓",
"tuner.tighten":"Zu tief — Saite anziehen ({c} Cent)",
"tuner.loosen":"Zu hoch — Saite lockern ({c} Cent)",
"tuner.noMicTip":"<b>Kein Mikrofon, oder die Erlaubnis verweigert?</b> Du kannst vollständig nach Gehör stimmen: tippe oben auf eine Saite, höre den Referenzton und spiele deine Saite daneben. Hörst du \“Schwebungen\”, die langsamer werden, je näher du kommst, bist du auf dem richtigen Weg.",
"tuner.moreLink":"Mehr über Gitarrenstimmungen (Wikipedia)"
},
pt:{
"tuner.mutedWarn":"O som está mudo — ative-o para ouvir o tom de referência",
"tuner.lead":"Escolha um instrumento e afine corda por corda. Afine de ouvido com um tom de referência contínuo, ou deixe o microfone conferir.",
"tuner.standard":"Afinação padrão","tuner.byString":"Afinar corda por corda",
"tuner.droneHint":"Tocar numa corda inicia um tom de referência que continua soando. Toque a sua corda ao lado dele — quando os dois se fundem sem \“batimentos\”, a corda está afinada. Toque de novo para parar.",
"tuner.stringN":"Corda {n} · {note}","tuner.offAny":"Longe de qualquer corda — confira se está na corda certa",
"tuner.stringOk":"A corda {n} está afinada ✓",
"tuner.tighten":"Grave demais — aperte a corda ({c} cents)",
"tuner.loosen":"Aguda demais — solte a corda ({c} cents)",
"tuner.noMicTip":"<b>Sem microfone, ou recusou a permissão?</b> Dá para afinar inteiramente de ouvido: toque numa corda acima, ouça o tom de referência e toque a sua corda ao lado. Se ouvir \“batimentos\” que ficam mais lentos conforme você se aproxima, está indo bem.",
"tuner.moreLink":"Mais sobre afinações de violão (Wikipédia)"
},
it:{
"tuner.mutedWarn":"L'audio è muto — attivalo per sentire il tono di riferimento",
"tuner.lead":"Scegli uno strumento e accorda corda per corda. Accorda a orecchio su un tono di riferimento tenuto, oppure lascia che il microfono ti controlli.",
"tuner.standard":"Accordatura standard","tuner.byString":"Accordare corda per corda",
"tuner.droneHint":"Toccare una corda avvia un tono di riferimento che continua a suonare. Suona la tua corda accanto — quando i due si fondono senza \“battimenti\”, la corda è accordata. Tocca di nuovo per fermarlo.",
"tuner.stringN":"Corda {n} · {note}","tuner.offAny":"Lontano da ogni corda — controlla di essere su quella giusta",
"tuner.stringOk":"La corda {n} è accordata ✓",
"tuner.tighten":"Troppo bassa — tendi la corda ({c} cent)",
"tuner.loosen":"Troppo alta — allenta la corda ({c} cent)",
"tuner.noMicTip":"<b>Niente microfono, o hai negato il permesso?</b> Puoi accordare del tutto a orecchio: tocca una corda qui sopra, ascolta il tono di riferimento e suona la tua corda accanto. Se senti \“battimenti\” che rallentano man mano che ti avvicini, stai andando bene.",
"tuner.moreLink":"Altro sulle accordature della chitarra (Wikipedia)"
},
am:{
"tuner.mutedWarn":"ድምፁ ተዘግቷል — የማመሳከሪያውን ድምፅ ለመስማት አብራው",
"tuner.lead":"መሣሪያ ምረጥ፣ ከዚያም ገመድ በገመድ አስተካክል። በቀጣይ የማመሳከሪያ ድምፅ በጆሮ ማስተካከል ትችላለህ፣ ወይም ማይክሮፎኑ እንዲፈትሽህ ፍቀድ።",
"tuner.standard":"መደበኛ ማስተካከያ","tuner.byString":"ገመድ በገመድ ማስተካከል",
"tuner.droneHint":"ገመድ ላይ መጫን የሚቀጥል የማመሳከሪያ ድምፅ ያስነሳል። ገመድህን ከጎኑ ተጫወት — ሁለቱ \“ምት\” ሳይኖር ሲዋሃዱ ገመዱ ተስተካክሏል። ለማቆም እንደገና ጫን።",
"tuner.stringN":"ገመድ {n} · {note}","tuner.offAny":"ከሁሉም ገመዶች የራቀ — በትክክለኛው ገመድ ላይ መሆንህን አረጋግጥ",
"tuner.stringOk":"ገመድ {n} ተስተካክሏል ✓",
"tuner.tighten":"በጣም ዝቅተኛ — ገመዱን አጥብቅ ({c} ሳንቲም)",
"tuner.loosen":"በጣም ከፍተኛ — ገመዱን አላላ ({c} ሳንቲም)",
"tuner.noMicTip":"<b>ማይክሮፎን የለም ወይም ፈቃዱን አልፈቀድክም?</b> ሙሉ በሙሉ በጆሮ ማስተካከል ትችላለህ፦ ከላይ ገመድ ጫን፣ የማመሳከሪያውን ድምፅ አዳምጥ፣ ገመድህንም ከጎኑ ተጫወት። እየቀረብክ ስትሄድ የሚቀንሱ \“ምቶች\” ከሰማህ በትክክለኛው መንገድ ላይ ነህ።",
"tuner.moreLink":"ስለ ጊታር ማስተካከያዎች ተጨማሪ (ውክፔዲያ)"
}
};
for(const c in K) I18N.register(c, K[c]);
})();
