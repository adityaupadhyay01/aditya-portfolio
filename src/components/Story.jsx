/* The documentary: intro -> seven chapters -> "Products are proof."
   Static markup only - the engine (src/experience) animates it. Element ids
   and classes are what the engine and the stylesheet hook into. */

const JOURNEY = [
  ['Chapter I',   'Learning',    'HTML in Notepad. CSS from W3Schools. Broke everything. Fixed it. Broke it again. That loop lasted months.'],
  ['Chapter II',  'Building',    'First real projects. Calculators. Todo lists. Tiny things that felt enormous at the time.'],
  ['Chapter III', 'Freelancing', 'Someone paid actual money for something I built. It was a simple landing page. It felt like shipping a rocket.'],
  ['Chapter IV',  'Reality',     "Good code isn't enough. Products need thinking. Users need clarity. Shipping matters more than perfection."],
];

const crtDim = { color: '#3a8a3a', fontSize: '0.88em' };

export default function Story() {
  return (
    <>
      {/* ============================ INTRO ============================ */}
      <section id="intro" className="chapter" data-chapter="intro" data-url="/kahani" aria-label="Introduction">
        <h1 className="sr-only">Aditya Upadhyay — CS Student, Full Stack Developer, AI Builder</h1>
        <div className="intro-wrap">
          <p className="intro-year" id="intro-year">Somewhere in 2015...<span className="intro-cursor" aria-hidden="true" /></p>
        </div>
        <div className="scroll-hint" aria-hidden="true">
          <span>scroll</span>
          <div className="scroll-hint-line" />
        </div>
      </section>

      {/* ====================== CHAPTER 1 - CURIOSITY ====================== */}
      <section id="ch1" className="chapter" data-chapter="ch1" data-url="/kahani/curiosity" aria-label="Chapter 1: Curiosity">
        <div className="room-glow" aria-hidden="true" />
        <canvas id="dust-canvas" aria-hidden="true" />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, width: '100%' }}>
          <div className="crt-wrap">
            <div className="speech-bubble" role="note" aria-label="How does this even work?">How does this even work?</div>
            <div className="crt-monitor" role="img" aria-label="Retro CRT monitor" id="crt-monitor">
              <div className="crt-screen">
                <div className="crt-line" id="crt-l1"><span className="crt-prompt">{'C:\\>'}</span> dir</div>
                <div className="crt-line" id="crt-l2" style={{ ...crtDim, marginTop: '2px' }}>{' Volume in drive C has no label.'}</div>
                <div className="crt-line" id="crt-l3" style={crtDim}>{' GAMES       <DIR>'}</div>
                <div className="crt-line" id="crt-l4" style={crtDim}>{' WINDOWS     <DIR>'}</div>
                <div className="crt-line" id="crt-l5" style={{ marginTop: '10px' }}>
                  <span className="crt-prompt">{'C:\\>'}</span>{' '}<span className="crt-cursor-inline" aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="crt-stand" aria-hidden="true" />
            <div className="crt-base" aria-hidden="true" />
          </div>
          <h2 className="ch1-headline">A curious kid.</h2>
        </div>
      </section>

      {/* ====================== CHAPTER 2 - DISCOVERY ====================== */}
      <section id="ch2" className="chapter" data-chapter="ch2" data-url="/kahani/discovery" aria-label="Chapter 2: Discovery">
        <p className="ch2-text" id="ch2-text">That one question changed everything.</p>
      </section>

      {/* ====================== CHAPTER 3 - LEARNING ====================== */}
      <section id="ch3" className="chapter" data-chapter="ch3" data-url="/kahani/learning" aria-label="Chapter 3: Learning">
        {/* float tags are added by the engine */}
        <div className="floating-field" aria-hidden="true" id="float-field" />
        <h2 className="ch3-headline" id="ch3-headline">Curiosity<br />became obsession.</h2>
      </section>

      {/* ====================== CHAPTER 4 - BUILDING ====================== */}
      <section id="ch4" className="chapter" data-chapter="ch4" data-url="/kahani/building" aria-label="Chapter 4: Building">
        <div className="journey-wrap">
          <p className="journey-eyebrow" id="journey-eyebrow">The journey</p>
          <div className="journey-entries" id="journey-entries">
            {JOURNEY.map(([phase, title, note], i) => (
              <div className="j-entry" id={'je-' + i} key={title}>
                <p className="j-phase">{phase}</p>
                <h3 className="j-title">{title}</h3>
                <p className="j-note">{note}</p>
                <div className="j-connector" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== CHAPTER 5 - FAILURES ====================== */}
      <section id="ch5" className="chapter" data-chapter="ch5" data-url="/kahani/failures" aria-label="Chapter 5: Failures">
        <div className="failure-wrap">
          <p className="failure-line-1" id="fail-1">Not everything worked.</p>
          <div className="failure-spacer" id="fail-spacer" />
          <p className="failure-line-2" id="fail-2">But every failure<br />taught something.</p>
        </div>
      </section>

      {/* ====================== CHAPTER 6 - RESTART ====================== */}
      <section id="ch6" className="chapter" data-chapter="ch6" data-url="/kahani/restart" aria-label="Chapter 6: Restart">
        <p className="ch6-phrase" id="ch6-phrase">Three years later...</p>
        <div className="terminal-window" id="terminal-window" role="region" aria-label="Terminal">
          <div className="terminal-bar">
            <div className="t-btn" />
            <div className="t-btn" />
            <div className="t-btn" />
            <div className="terminal-title-bar">bash — 80×24</div>
          </div>
          <div className="terminal-body" id="terminal-body">
            <div className="t-row">
              <span className="t-user">dev</span><span className="t-path">@local ~ $</span>
              {/* typed by the engine */}
              <span className="t-input" id="term-cmd" /><span className="terminal-cursor" id="term-cursor" aria-hidden="true" />
            </div>
            <div id="term-output" />
          </div>
        </div>
      </section>

      {/* ====================== CHAPTER 7 - TODAY ====================== */}
      <section id="ch7" className="chapter" data-chapter="ch7" data-url="/kahani/today" aria-label="Chapter 7: Today">
        <p className="today-eyebrow" id="today-eyebrow">Today</p>
        <div className="today-roles">
          <h2 className="today-role bright" id="tr-0">Computer Science</h2>
          <h2 className="today-role dim" id="tr-1">Student.</h2>
          <h2 className="today-role bright" id="tr-2" style={{ marginTop: '12px' }}>Full Stack</h2>
          <h2 className="today-role dim" id="tr-3">Developer.</h2>
          <h2 className="today-role accent" id="tr-4" style={{ marginTop: '12px' }}>AI Builder.</h2>
        </div>
        <p className="today-sub" id="today-sub">Still curious.</p>
      </section>

      {/* ============================ TRANSITION ============================ */}
      <section id="transition" className="chapter" data-chapter="transition" data-url="/kahani/work" aria-label="Transition to work">
        <div className="trans-inner">
          <p className="trans-line-1" id="trans-1">Stories are interesting.<br /><em>Products are proof.</em></p>
          <div className="trans-sep" id="trans-sep" />
        </div>
      </section>
    </>
  );
}
