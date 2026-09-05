/* Legal documents – English */
I18N.register("en", {

"legal.updated":"Last updated: {date}",
"legal.updatedDate":"30 August 2026",
"legal.contactH":"Contact details",
"legal.contactHours":"Enquiries are answered Sunday–Thursday, within 5 business days at the latest.",
"legal.langNote":"",

/* ============ Accessibility statement ============ */
"legal.a11y.title":"Accessibility statement",
"legal.a11y.body":`
<p>At "I Play" we regard accessibility as a core value, and we work so that every person —
including people with disabilities — can learn to play using this app independently, with dignity and comfort.</p>

<div class="toc"><b>Contents</b><ol>
  <li>Conformance level and standard</li>
  <li>What has actually been implemented</li>
  <li>The in-app accessibility bar</li>
  <li>Adjustments specific to learning music</li>
  <li>Multilingual accessibility</li>
  <li>Parts that are not yet fully accessible</li>
  <li>Accessibility officer and how to contact us</li>
</ol></div>

<h2>1. Conformance level and standard</h2>
<p>The app was built in accordance with the Israeli <b>Equal Rights for Persons with Disabilities
(Accessibility Adjustments to Services) Regulations, 2013</b>, and in particular regulation 35 concerning
internet services, and with <b>Israeli Standard IS 5568</b> — "Guidelines for web content accessibility" —
which is based on the international <b>WCAG 2.1</b> guidelines at conformance level <b>AA</b>.</p>

<h2>2. What has actually been implemented</h2>
<table>
<tr><th>Area</th><th>What was done</th></tr>
<tr><td>Keyboard navigation</td><td>Every component — including the piano keyboard, chord diagrams, drum pads, the song player and the quizzes — is fully operable by keyboard alone, in a logical tab order, with a clear focus indicator.</td></tr>
<tr><td>Screen readers</td><td>Semantic markup, ARIA and live regions (aria-live). Every chord diagram carries a full written description, and every melody has a complete note list that can be read aloud.</td></tr>
<tr><td>Colour contrast</td><td>At least 4.5:1 for body text in both display modes, plus a dedicated high-contrast mode.</td></tr>
<tr><td>Text resizing</td><td>Enlargement up to 180% from inside the app itself without loss of content or function, on top of browser zoom.</td></tr>
<tr><td>Structure and orientation</td><td>A "skip to main content" link, hierarchical headings, and document language and writing direction set dynamically according to the chosen language.</td></tr>
<tr><td>Forms</td><td>Every field has an associated label, error messages are textual and explicit, and no information is conveyed by colour alone.</td></tr>
<tr><td>Animation</td><td>The operating-system <code>prefers-reduced-motion</code> setting is honoured, plus a manual switch to stop animations.</td></tr>
<tr><td>Touch targets</td><td>A minimum touch area of 44 pixels for every interactive element.</td></tr>
</table>

<h2>3. The accessibility bar</h2>
<p>Every page shows a permanent accessibility button (bottom corner), which also opens with the keyboard
shortcut <b>Alt+0</b>. It offers: text enlargement and reduction, high contrast, inverted colours, greyscale,
link highlighting, a readable font, increased spacing, stopping animations, an enlarged cursor, a reading
guide, a strong focus outline — and dedicated adjustments for the hard of hearing. Preferences are stored on
the device and restored automatically on every visit, in all languages.</p>

<h2>4. Adjustments specific to learning music</h2>
<ul>
<li><b>Deaf and hard of hearing:</b> a visual mode in which the metronome flashes on screen, vibration on
supported devices, a visual representation of every beat and rhythm, and a note strip that advances in real
time with the music.</li>
<li><b>Blind and low vision:</b> every note is announced as it is played, every chord has an ordered written
description (string, fret and finger), every song has a full textual note list, and the piano keyboard can be
played with the computer keys a–;.</li>
<li><b>Motor disabilities:</b> nothing in the app requires dragging, double-clicking or precise timing; every
exercise and song can be slowed to 50%, and no task has a time limit.</li>
<li><b>Learning and attention differences:</b> short lessons (8–15 minutes), plain language, numbered steps,
and no background noise or visual distraction.</li>
</ul>

<h2>5. Multilingual accessibility</h2>
<p>The app is available in ten languages: Hebrew, English, Arabic, Russian, French, Spanish, German,
Portuguese, Italian and Amharic. For Hebrew and Arabic the writing direction is set automatically to
right-to-left, and the document's <code>lang</code> attribute is updated accordingly — so that screen readers
pronounce the content in the correct language and accent. Multilingual access is part of making the service
accessible to populations who do not speak Hebrew as a first language.</p>

<h2>6. Parts that are not yet fully accessible</h2>
<p>Despite our efforts, some components may not yet be fully accessible:</p>
<ul>
<li><b>The microphone-based tuner</b> presents visual information (a needle) alongside textual information.
Screen-reader users receive a spoken statement of the pitch, but the needle itself updates rapidly and is not
announced continuously.</li>
<li>Some ear-training exercises are inherently based on hearing and therefore cannot be made fully accessible
to deaf users. Visual rhythm exercises are provided as an alternative.</li>
</ul>
<p>We continue to improve accessibility on an ongoing basis. If you encounter a component that is not
accessible, we would very much like to hear about it.</p>

<h2>7. Accessibility officer and how to contact us</h2>
<p>The accessibility officer for this service is <b>{name}</b>. You may contact him with any question,
request or complaint regarding accessibility, including reporting an accessibility fault or requesting a
personal adjustment:</p>
{contact}
<p class="muted">If your enquiry is not handled satisfactorily, you may contact the Commission for Equal
Rights of Persons with Disabilities at the Israeli Ministry of Justice.</p>`,

/* ============ Privacy policy ============ */
"legal.privacy.title":"Privacy policy",
"legal.privacy.body":`
<div class="tip"><b>Briefly, with no small print:</b> "I Play" runs entirely in your browser.
We have no server collecting data, there is no user account, no advertising cookies and no tracking or
analytics tools. All of your progress, repertoire, journal and preferences are stored solely on your device,
and we never see them.</div>

<h2>1. General</h2>
<p>This policy explains how information is collected, stored and processed when you use the app, in accordance
with the Israeli <b>Protection of Privacy Law, 1981</b> and the regulations made under it, including the
Protection of Privacy (Data Security) Regulations, 2017, and the amendments that came into force in 2025.
For users in the European Union the policy is also applied in the spirit of the GDPR.</p>

<h2>2. What information is stored</h2>
<table>
<tr><th>Type of information</th><th>Purpose</th><th>Where it is stored</th></tr>
<tr><td>Lesson progress, XP, badges and day streaks</td><td>Showing your progress and unlocking the next lesson</td><td>localStorage on your device</td></tr>
<tr><td>Repertoire — the list of songs you marked as playable</td><td>Tracking your result and issuing a certificate</td><td>localStorage on your device</td></tr>
<tr><td>Practice journal (free text you write)</td><td>Personal practice tracking</td><td>localStorage on your device</td></tr>
<tr><td>Display, language and accessibility preferences</td><td>Remembering your choices between visits</td><td>localStorage on your device</td></tr>
<tr><td>Subscription details (in the demo build)</td><td>Marking content access</td><td>localStorage on your device</td></tr>
</table>
<p><b>Information we do not collect:</b> name, address, phone number, identity number, payment details,
location, contacts, browsing history or advertising identifiers. The name printed on the certificate is
stored on your device only and is never transmitted.</p>

<h2>2a. Data durability — three layers on your device</h2>
<p>Local storage is a fragile place: the browser may delete it when the device runs out of space, clearing
"site data" wipes it, and private browsing does not keep it at all. So that you never lose months of practice,
the app runs three layers — <b>all of them entirely inside your device</b>:</p>
<ul>
<li><b>Persistent storage:</b> the app asks the browser to mark your data as persistent so it is not evicted
automatically when space runs low. The request goes to your browser, not to a server.</li>
<li><b>A second copy in IndexedDB:</b> an additional storage mechanism in the same browser. If the main storage
is wiped, the app restores your progress from it on the next launch. It is equally local.</li>
<li><b>Automatic file backup (optional):</b> if you choose to, the app asks you to pick a file on your computer
and writes your data to it on every change, using the File System Access API. The choice is yours, the file
lives where you put it, and the app has no access to any other file. You can switch it off at any moment on
the "My data and backup" screen.</li>
</ul>
<p>The app also offers, from time to time, to export a backup file. If you choose to share it (over WhatsApp,
to your own cloud drive, and so on) that is your action, performed through your operating system's share
sheet — not through us. We never see the file.</p>
<p><b>Please note:</b> because the data exists only on your side, we have no way to restore it for you.
Clearing site data or the browser deletes it permanently. The file backup is the only protection against that.</p>

<h2>3. Microphone</h2>
<p>The tuner requests permission to access the microphone. To be clear: <b>the sound is processed in real time
inside your browser only, is not recorded, is not stored and is not sent to any server.</b> The permission is
needed solely to calculate pitch. You may decline and use the reference tones instead with no loss of service.
The permission ends the moment you leave the tuner page.</p>

<h2>4. Cookies and tracking</h2>
<p>The app <b>uses no cookies at all</b>, and contains no Google Analytics, advertising pixels, embedded social
networks or any other tracking tool. The only technical storage used is local storage on your device
(localStorage and IndexedDB), which lives on your
device and serves the functioning of the service alone.</p>

<h2>5. Transfer to third parties</h2>
<p>No information is transferred to third parties, for the simple reason that no information is held by us.
In a future commercial version, if a licensed payment provider is integrated, payment details will pass
directly to it in encrypted form, and this document will be updated explicitly before that goes live.</p>

<h2>6. Your rights</h2>
<ul>
<li><b>Access:</b> all information is visible to you on the "My progress" and "My repertoire" pages.</li>
<li><b>Portability:</b> the "Export data" button downloads everything as a JSON file.</li>
<li><b>Rectification:</b> you can edit or delete any journal entry and unmark any song.</li>
<li><b>Erasure:</b> the "Delete all data" button permanently removes everything from the device. Clearing site
data in your browser settings achieves the same result.</li>
</ul>

<h2>7. Minors</h2>
<p>The app is also intended for children and teenagers. Since we collect no identifying information, parental
consent is not required for data collection. Nevertheless we recommend that a parent accompanies a child under
13 when using the microphone feature and when making a purchase.</p>

<h2>8. Data security</h2>
<p>Because the information never leaves your device, security risks are limited to the security of the device
itself. We recommend locking your device with a passcode and not leaving the app open on a shared device.</p>

<h2>9. Changes to this policy</h2>
<p>We will update this document when the service changes materially, and the update date appears at the top
of the page.</p>

<h2>10. Privacy contact</h2>
{contact}`,

/* ============ Terms of use ============ */
"legal.terms.title":"Terms of use",
"legal.terms.body":`
<h2>1. Acceptance</h2>
<p>Using the "I Play" app constitutes acceptance of these terms. If you do not agree with them, please do
not use the service.</p>

<h2>2. Nature of the service</h2>
<p>The service is a self-study tool for learning to play, comprising written lessons, interactive components,
a melody library and practice tools. It is not a substitute for a human teacher. The "certificate of
completion" that the app can issue is a motivational document recording completion of a self-study path only —
it is not a diploma, qualification or academic credit from an accredited institution, and must not be
presented as such.</p>

<h2>3. Access and payment model</h2>
<ul>
<li>The first three lessons on each instrument are open with no payment and no sign-up.</li>
<li>The remaining lessons are available to subscribers according to the plan purchased.</li>
<li>The practice tools (metronome, tuner, ear training, chord library) and the song library are free without limit.</li>
</ul>
<div class="warnbox"><b>Demo build:</b> in the current version the payment mechanism is a simulation only.
No charge is made, no card details are collected and no valid invoice is issued. Before commercial launch a
licensed payment provider will be integrated and the payment, billing and cancellation clauses updated
accordingly.</div>

<h2>4. Cancellation and refunds</h2>
<p>In the commercial version, cancellation will follow the applicable consumer law. For users in Israel: the
<b>Consumer Protection Law, 1981</b> and the <b>Consumer Protection (Cancellation of a Transaction)
Regulations, 2010</b>, including the right to cancel a distance sale within 14 days of the transaction or of
receiving the transaction details document, whichever is later. Persons with disabilities, senior citizens
and new immigrants have an extended cancellation right of up to four months under that law. Users in the
European Union have a 14-day right of withdrawal under the Consumer Rights Directive.</p>

<h2>5. Intellectual property</h2>
<p>All learning content, texts, translations, design, code and original exercises in the app are protected
under the Israeli <b>Copyright Act, 2007</b> and international conventions. You may not copy, reproduce,
distribute, broadcast or make commercial use of the content without prior written permission. The melodies
used are works whose copyright has expired — see the <a href="#/legal/credits">sources page</a>.</p>

<h2>6. Permitted use</h2>
<p>You may use the service for personal, non-commercial learning. You may not use it in a way that infringes
the rights of others, attempt to circumvent the content-access mechanisms, or use the content for commercial
instruction of third parties without an appropriate licence.</p>

<h2>7. Liability and health</h2>
<p>The service is provided "AS IS". Playing an instrument is a physical activity: prolonged practice or a
wrong posture can overload the hands, neck or back, and exposure to high sound levels can damage hearing.
The content in the app is not medical advice. In case of pain, persistent discomfort or reduced hearing, stop
and consult a qualified professional.</p>

<h2>8. Changes to the service</h2>
<p>We may update, add or remove content and features. Material changes to these terms will be published on
this page.</p>

<h2>9. Governing law and jurisdiction</h2>
<p>These terms are governed by the laws of the State of Israel. Exclusive jurisdiction lies with the competent
courts of the Jerusalem District, without derogating from mandatory consumer rights granted to the user under
the law of their place of residence.</p>

<h2>10. Contact</h2>
{contact}`,

/* ============ Copyright and sources ============ */
"legal.credits.title":"Copyright and sources",
"legal.credits.intro":`
<div class="tip"><b>The principle that guided us:</b> a music-learning app is a copyright minefield.
We therefore built "I Play" so that it uses no recordings, no samples, no scanned sheet music and no lyrics
of protected works — not one.</div>

<h2>1. Every sound is synthesised in real time</h2>
<p>The app contains not a single audio file. Every sound — piano, guitar, ukulele, recorder, bass and drums —
is generated in real time by an original synthesis engine written for this app, using the browser's Web Audio
API. Consequently no samples or recordings protected by performers' or producers' rights are used.</p>

<h2>2. The melodies — public domain only</h2>
<p>Under the Israeli <b>Copyright Act, 2007</b> (and under the Berne Convention and most copyright laws
worldwide), copyright in a musical work expires 70 years after the death of the author. All {n} melodies in
the app are works whose protection period lapsed long ago, or traditional folk tunes with no known author:</p>`,
"legal.credits.tableWork":"Work",
"legal.credits.tableSrc":"Source and status",
"legal.credits.rest":`
<h2>3. No lyrics of protected songs</h2>
<p>The app presents melodies only — without lyrics. The reason: even when a melody is in the public domain,
the words set to it in the twentieth century may carry separate copyright. The app therefore contains no song
texts, and we do not present modern songs whose rights are still in force.</p>

<h2>4. Learning content</h2>
<p>All lessons, explanations, exercises, quizzes, tips and translations were written originally for
"I Play". Basic musical facts — note names, scale structure, chord fingerings — are not protected by
copyright (ideas and facts are not protected, only their expression), and even so the diagrams and wording in
this app were produced originally and copied from no source.</p>

<h2>5. Design, fonts and code</h2>
<p>The design and code were written originally. The app uses system fonts only and loads no external fonts or
libraries, so there is no dependency on third-party licences and no information is sent to external servers.</p>

<h2>6. Icons</h2>
<p>All symbols in the app are standard operating-system emoji characters, or SVG graphics created originally.</p>

<h2>7. Reporting an infringement</h2>
<p>If you believe any content in the app infringes copyright, we will be glad to review it and remove it
promptly:</p>`
});
