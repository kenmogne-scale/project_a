'use client';

import { useEffect, useMemo, useState } from 'react';

type SortMode = 'irr' | 'moic';
type PortfolioMetric = 'invested' | 'realised' | 'unrealised';

const snapshot = [
  { value: '13.6%', label: 'Post-round Gross IRR', delta: '+1.6pp' },
  { value: '2.59×', label: 'Post-round Gross MOIC', delta: '+0.20×' },
  { value: '€4.65m', label: 'Capital call', delta: '100% allocated' },
  { value: '2.00×', label: 'LP TVPI', delta: 'Post Series E' },
];

const portfolio = [
  { name: 'Spotify', irr: 2.7, moic: 1.20, invested: 4316721, realised: 200000, unrealised: 5000000, color: '#d7ff37', note: 'Partially realised' },
  { name: 'Facebook', irr: 8.3, moic: 1.79, invested: 4631014, realised: 0, unrealised: 8300000, color: '#4f73ff', note: 'Unrealised' },
  { name: 'Netflix', irr: 5.8, moic: 1.55, invested: 22629627, realised: 35000000, unrealised: 0, color: '#ff765f', note: 'Realised' },
  { name: 'Apple', irr: 4.8, moic: 1.39, invested: 10793618, realised: 0, unrealised: 15000000, color: '#ffe478', note: 'Unrealised' },
  { name: 'Delivery Hero', irr: -15.3, moic: 0.33, invested: 10476929, realised: 500000, unrealised: 3000000, color: '#73ddbd', note: 'Mixed value' },
  { name: 'Skype', irr: null, moic: 0, invested: 10407921, realised: 0, unrealised: 0, color: '#8c9087', note: 'Written off' },
  { name: 'Zoom', irr: 33.1, moic: 6.48, invested: 1850479, realised: 0, unrealised: 12000000, color: '#a18dff', note: 'Unrealised' },
  { name: 'N26', irr: 53.1, moic: 43.72, invested: 2287538, realised: 0, unrealised: 100000000, color: '#f2f0e9', note: 'Unrealised' },
  { name: 'Revolut', irr: -54.5, moic: 0.34, invested: 2901409, realised: 1000000, unrealised: 0, color: '#ff5694', note: 'Realised' },
  { name: 'Solarisbank', irr: 5.0, moic: 1.46, invested: 13704744, realised: 0, unrealised: 20000000, color: '#31c9ff', note: 'Pre Series E' },
];

const metricOptions: { key: PortfolioMetric; label: string; shortLabel: string }[] = [
  { key: 'invested', label: 'Invested capital', shortLabel: 'invested capital' },
  { key: 'realised', label: 'Realised capital', shortLabel: 'realised capital' },
  { key: 'unrealised', label: 'Unrealised capital', shortLabel: 'unrealised capital' },
];

const lpAllocations = [
  { name: 'Mark Zuckerberg', share: 22, call: 1023000 },
  { name: 'Warren Buffett', share: 15, call: 697500 },
  { name: 'Jeff Bezos', share: 12, call: 558000 },
  { name: 'Larry Ellison', share: 12, call: 558000 },
  { name: 'Larry Page', share: 10, call: 465000 },
  { name: 'F. Bettencourt Meyers', share: 9.2, call: 427800 },
  { name: 'Elon Musk', share: 7.8, call: 362700, highlight: true },
  { name: 'Bill Gates', share: 5.9, call: 274350 },
  { name: 'Steve Ballmer', share: 4.1, call: 190650 },
  { name: 'Sergey Brin', share: 2, call: 93000 },
];

const methods = [
  {
    title: 'Gross IRR',
    formula: 'XIRR (portfolio cash flows, transaction dates)',
    copy: 'Annualised return based on the timing of invested capital, realised proceeds and the reporting-date residual value.',
  },
  {
    title: 'Gross MOIC',
    formula: '(Realised + Unrealised Value) / Invested Capital',
    copy: 'A time-independent value multiple used alongside IRR to separate absolute value creation from investment timing.',
  },
  {
    title: 'LP Performance',
    formula: 'TVPI = DPI + RVPI',
    copy: 'DPI captures distributions over paid-in capital; RVPI captures net residual value over paid-in capital.',
  },
  {
    title: 'Core assumptions',
    formula: 'Reporting date: 28 Aug 2026',
    copy: 'All realised amounts are treated as distributed. No assets or liabilities exist beyond the supplied case tables.',
  },
];

const formatEuro = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

const formatEuroCompact = (value: number) => value === 0
  ? '€0.00m'
  : `€${(value / 1_000_000).toFixed(value >= 10_000_000 ? 1 : 2)}m`;

function makeDonutGradient(metric: PortfolioMetric, companies: typeof portfolio) {
  const total = companies.reduce((sum, company) => sum + company[metric], 0);
  let cursor = 0;
  return companies
    .filter((company) => company[metric] > 0)
    .map((company) => {
      const start = cursor;
      const end = start + (company[metric] / total) * 100;
      cursor = end;
      const colorEnd = Math.max(start, end - 0.14);
      return `${company.color} ${start.toFixed(4)}% ${colorEnd.toFixed(4)}%, #151612 ${colorEnd.toFixed(4)}% ${end.toFixed(4)}%`;
    })
    .join(', ');
}

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState('Netflix');
  const [portfolioMetric, setPortfolioMetric] = useState<PortfolioMetric>('invested');
  const [sortMode, setSortMode] = useState<SortMode>('moic');
  const [roundView, setRoundView] = useState<'pre' | 'post'>('post');
  const [activeSection, setActiveSection] = useState('top');
  const [scrollProgress, setScrollProgress] = useState(0);

  const selected = portfolio.find((company) => company.name === selectedCompany) ?? portfolio[2];
  const activeMetric = metricOptions.find((metric) => metric.key === portfolioMetric) ?? metricOptions[0];
  const portfolioTotal = portfolio.reduce((sum, company) => sum + company[portfolioMetric], 0);
  const selectedMetricValue = selected[portfolioMetric];
  const selectedShare = portfolioTotal > 0 ? (selectedMetricValue / portfolioTotal) * 100 : 0;
  const compositionPortfolio = useMemo(
    () => [...portfolio].sort((a, b) => b[portfolioMetric] - a[portfolioMetric]),
    [portfolioMetric],
  );
  const donutGradient = useMemo(
    () => makeDonutGradient(portfolioMetric, compositionPortfolio),
    [portfolioMetric, compositionPortfolio],
  );
  const rankedPortfolio = useMemo(
    () => [...portfolio].sort((a, b) => sortMode === 'moic' ? b.moic - a.moic : (b.irr ?? -100) - (a.irr ?? -100)),
    [sortMode],
  );

  const changePortfolioMetric = (metric: PortfolioMetric) => {
    setPortfolioMetric(metric);
    const largest = portfolio.reduce((best, company) => company[metric] > best[metric] ? company : best, portfolio[0]);
    setSelectedCompany(largest.name);
  };

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.12 },
    );
    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

    const sectionObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActiveSection(entry.target.id)),
      { rootMargin: '-40% 0px -50% 0px' },
    );
    document.querySelectorAll('main > section[id]').forEach((section) => sectionObserver.observe(section));

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      revealObserver.disconnect();
      sectionObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const roundData = roundView === 'post'
    ? { label: 'Post Series E', holding: '€47.5m', solarisIrr: '15.9%', solarisMoic: '2.68×', fundIrr: '13.6%', fundMoic: '2.59×' }
    : { label: 'Pre Series E', holding: '€20.0m', solarisIrr: '5.0%', solarisMoic: '1.46×', fundIrr: '12.0%', fundMoic: '2.38×' };

  return (
    <main>
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="wordmark" href="#top" aria-label="Project A case study home">
          <span className="mark">A</span>
          <span>Fund VII / Case 2026</span>
        </a>
        <div className="nav-links">
          {[
            ['portfolio', 'Portfolio'],
            ['series-e', 'Series E'],
            ['capital-call', 'Capital Call'],
            ['lp-performance', 'LP Performance'],
          ].map(([id, label]) => (
            <a key={id} className={activeSection === id ? 'active' : ''} href={`#${id}`}>{label}</a>
          ))}
        </div>
        <a className="nav-cta" href="#portfolio">Explore the case <span>↘</span></a>
      </nav>

      <section id="top" className="hero section-shell">
        <div className="hero-copy reveal is-visible">
          <div className="eyebrow"><span className="live-dot" /> Venture Fund Reporting Case Study</div>
          <h1>From fund data<br />to <em>decision clarity.</em></h1>
          <p className="hero-lede">
            An interactive performance review of a fictitious ten-company portfolio — translating cash flows,
            a Series E financing and LP economics into an auditable investment story.
          </p>
          <div className="hero-actions">
            <a className="button-primary" href="#portfolio">Explore performance <span>↓</span></a>
            <span className="report-date"><small>Reporting date</small>28 August 2026</span>
          </div>
        </div>

        <div className="hero-visual reveal is-visible" aria-label="Portfolio performance preview">
          <div className="visual-topline">
            <span>Fund trajectory</span><span className="mono">PRE → POST</span>
          </div>
          <div className="trajectory-grid">
            <div className="trajectory-axis"><span>14%</span><span>12%</span><span>10%</span></div>
            <div className="trajectory-chart">
              <span className="grid-line line-one" /><span className="grid-line line-two" /><span className="grid-line line-three" />
              <span className="data-line" />
              <span className="data-point point-pre"><b>12.0%</b><small>Pre</small></span>
              <span className="data-point point-post"><b>13.6%</b><small>Post</small></span>
            </div>
          </div>
          <div className="visual-footer">
            <div><small>Gross IRR uplift</small><strong>+160 bps</strong></div>
            <div><small>Gross MOIC uplift</small><strong>+0.20×</strong></div>
          </div>
        </div>
      </section>

      <section className="snapshot section-shell reveal" aria-label="Executive snapshot">
        <div className="section-kicker-row">
          <p className="section-kicker">Executive snapshot</p>
          <p className="micro-note">Fictitious portfolio · Gross performance · EUR</p>
        </div>
        <div className="snapshot-grid">
          {snapshot.map((item, index) => (
            <article key={item.label} className="metric-card">
              <span className="metric-index">0{index + 1}</span>
              <strong>{item.value}</strong>
              <p>{item.label}</p>
              <small>{item.delta}</small>
            </article>
          ))}
        </div>
        <p className="executive-note">
          The Series E improves both fund-level return measures, while the LP value remains primarily unrealised.
          The result is attractive — and still dependent on future portfolio liquidity.
        </p>
      </section>

      <section id="portfolio" className="portfolio-section">
        <div className="section-shell reveal">
          <header className="section-heading light-heading">
            <div><p className="section-kicker">01 / Portfolio performance</p><span className="section-tag">Pre Series E</span></div>
            <h2>Ten companies.<br /><em>One fund view.</em></h2>
            <p>Switch between invested cost, realised proceeds and residual value to see how each company contributes to the portfolio — then inspect return quality below.</p>
          </header>

          <div className="portfolio-workbench">
            <div className="composition-card">
              <div className="composition-card-header">
                <div><span>Portfolio composition</span><small>Pre Series E · EUR</small></div>
                <div className="composition-filter" aria-label="Choose portfolio composition metric">
                  {metricOptions.map((metric) => (
                    <button key={metric.key} className={portfolioMetric === metric.key ? 'active' : ''} onClick={() => changePortfolioMetric(metric.key)}>{metric.label}</button>
                  ))}
                </div>
              </div>
              <div className="composition-layout">
                <div className="donut-wrap">
                  <div className="portfolio-donut" style={{ background: `conic-gradient(${donutGradient})` }} role="img" aria-label={`${activeMetric.label} by portfolio company`}>
                    <div className="donut-center">
                      <small>Total {activeMetric.shortLabel}</small>
                      <strong>{formatEuroCompact(portfolioTotal)}</strong>
                      <span>{selected.name} · {selectedShare.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="portfolio-legend" role="list" aria-label={`${activeMetric.label} legend`}>
                  {compositionPortfolio.map((company) => {
                    const share = portfolioTotal > 0 ? (company[portfolioMetric] / portfolioTotal) * 100 : 0;
                    return (
                      <button key={company.name} role="listitem" className={company.name === selectedCompany ? 'active' : ''} onClick={() => setSelectedCompany(company.name)}>
                        <i style={{ background: company.color }} /><span><b>{company.name}</b><small>{formatEuroCompact(company[portfolioMetric])}</small></span><em>{company[portfolioMetric] === 0 ? '—' : `${share.toFixed(1)}%`}</em>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <aside className="company-inspector" aria-live="polite">
              <div className="inspector-label"><span>Selected company</span><span className={selected.irr !== null && selected.irr < 0 ? 'status-negative' : 'status-positive'}>{selected.note}</span></div>
              <h3>{selected.name}</h3>
              <div className="inspector-metrics">
                <div className="inspector-active-metric"><small>{activeMetric.label}</small><strong>{formatEuroCompact(selectedMetricValue)}</strong></div>
                <div><small>Share of {activeMetric.shortLabel}</small><strong>{selectedShare.toFixed(1)}%</strong></div>
                <div><small>Gross IRR</small><strong>{selected.irr === null ? 'N.A.' : `${selected.irr.toFixed(1)}%`}</strong></div>
                <div><small>Gross MOIC</small><strong>{selected.moic.toFixed(2)}×</strong></div>
              </div>
              <p>{selectedMetricValue === 0 ? `${selected.name} has no ${activeMetric.shortLabel} in the supplied pre-round portfolio data.` : `${selected.name} represents ${selectedShare.toFixed(1)}% of total ${activeMetric.shortLabel}. Its return profile remains visible alongside the allocation view.`}</p>
            </aside>
          </div>

          <div className="ranking-panel">
            <div className="ranking-header">
              <div><p className="section-kicker">Performance ranking</p><h3>Portfolio companies</h3></div>
              <div className="segmented-control" aria-label="Sort portfolio">
                <button className={sortMode === 'moic' ? 'active' : ''} onClick={() => setSortMode('moic')}>By MOIC</button>
                <button className={sortMode === 'irr' ? 'active' : ''} onClick={() => setSortMode('irr')}>By IRR</button>
              </div>
            </div>
            <div className="ranking-table" role="table" aria-label="Portfolio company ranking">
              <div className="ranking-row ranking-labels" role="row"><span># / Company</span><span>Value status</span><span>Gross IRR</span><span>Gross MOIC</span></div>
              {rankedPortfolio.map((company, index) => (
                <button key={company.name} className="ranking-row" role="row" onClick={() => setSelectedCompany(company.name)}>
                  <span><i>{String(index + 1).padStart(2, '0')}</i>{company.name}</span><span>{company.note}</span>
                  <span className={company.irr !== null && company.irr < 0 ? 'negative-text' : ''}>{company.irr === null ? 'N.A.' : `${company.irr.toFixed(1)}%`}</span>
                  <span>{company.moic.toFixed(2)}×</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="series-e" className="series-section section-shell reveal">
        <header className="section-heading">
          <div><p className="section-kicker">02 / Deal impact</p><span className="section-tag dark-tag">Solarisbank Series E</span></div>
          <h2>A follow-on round<br /><em>reshapes the view.</em></h2>
          <p>Post-money valuation and fully diluted ownership translate the round terms into a new holding value — then flow through to company and fund returns.</p>
        </header>

        <div className="deal-equation" aria-label="Series E valuation equation">
          <div><small>Pre-money</small><strong>€1.00bn</strong></div><span>+</span>
          <div><small>Primary investment</small><strong>€250m</strong></div><span>=</span>
          <div className="equation-highlight"><small>Post-money</small><strong>€1.25bn</strong></div><span>×</span>
          <div><small>PA ownership</small><strong>3.80%</strong></div><span>=</span>
          <div className="equation-final"><small>Holding value</small><strong>€47.5m</strong></div>
        </div>

        <div className="round-comparison">
          <div className="round-toggle" aria-label="Choose Series E view">
            <button className={roundView === 'pre' ? 'active' : ''} onClick={() => setRoundView('pre')}>Pre round</button>
            <button className={roundView === 'post' ? 'active' : ''} onClick={() => setRoundView('post')}>Post round</button>
          </div>
          <div className="round-feature">
            <span className="round-label">{roundData.label}</span>
            <strong>{roundData.holding}</strong>
            <p>Project A holding value</p>
            <div className="value-track"><span style={{ width: roundView === 'post' ? '100%' : '42%' }} /></div>
          </div>
          <div className="round-metric-grid">
            <div><small>Solarisbank IRR</small><strong>{roundData.solarisIrr}</strong>{roundView === 'post' && <span>+10.9pp</span>}</div>
            <div><small>Solarisbank MOIC</small><strong>{roundData.solarisMoic}</strong>{roundView === 'post' && <span>+1.22×</span>}</div>
            <div><small>Fund IRR</small><strong>{roundData.fundIrr}</strong>{roundView === 'post' && <span>+1.6pp</span>}</div>
            <div><small>Fund MOIC</small><strong>{roundData.fundMoic}</strong>{roundView === 'post' && <span>+0.20×</span>}</div>
          </div>
        </div>
      </section>

      <section id="capital-call" className="capital-section">
        <div className="section-shell reveal">
          <header className="section-heading capital-heading">
            <div><p className="section-kicker">03 / Capital call</p><span className="section-tag light-tag">LP allocation</span></div>
            <h2>€4.65m called.<br /><em>Every euro allocated.</em></h2>
            <p>The follow-on investment, management fee and fund expenses are allocated pro rata across ten limited partners.</p>
          </header>

          <div className="call-composition">
            <div className="composition-total"><small>Total capital call</small><strong>€4,650,000</strong><span>100.0%</span></div>
            <div className="stacked-bar" aria-label="Capital call composition">
              <span className="investment-segment" style={{ flexGrow: 400 }} /><span className="fee-segment" style={{ flexGrow: 50 }} /><span className="expense-segment" style={{ flexGrow: 15 }} />
            </div>
            <div className="composition-legend">
              <span><i className="investment-key" />Series E investment <b>€4.00m · 86.0%</b></span>
              <span><i className="fee-key" />Management fee <b>€0.50m · 10.8%</b></span>
              <span><i className="expense-key" />Fund expenses <b>€0.15m · 3.2%</b></span>
            </div>
          </div>

          <div className="lp-list">
            <div className="lp-list-header"><span>Limited partner</span><span>Share</span><span>Allocated capital call</span></div>
            {lpAllocations.map((lp) => (
              <div key={lp.name} className={`lp-row ${lp.highlight ? 'highlight' : ''}`}>
                <span>{lp.highlight && <i>Selected answer</i>}{lp.name}</span>
                <span>{lp.share.toFixed(lp.share % 1 ? 1 : 0)}%</span>
                <span className="lp-bar-cell"><i style={{ width: `${(lp.call / 1023000) * 100}%` }} /><b>{formatEuro(lp.call)}</b></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="lp-performance" className="lp-section section-shell reveal">
        <header className="section-heading">
          <div><p className="section-kicker">04 / LP performance</p><span className="section-tag dark-tag">Post Series E</span></div>
          <h2>From paid-in capital<br />to <em>total value.</em></h2>
          <p>A transparent bridge from contributions to realised and residual value makes the LP outcome both understandable and auditable.</p>
        </header>

        <div className="value-bridge">
          <article><span>01</span><small>Paid-in capital pre round</small><strong>€108.00m</strong><i style={{ width: '47.9%' }} /></article>
          <div className="bridge-operator">+</div>
          <article><span>02</span><small>Series E capital call</small><strong>€4.65m</strong><i style={{ width: '8%' }} /></article>
          <div className="bridge-operator">=</div>
          <article className="bridge-emphasis"><span>03</span><small>Paid-in capital post</small><strong>€112.65m</strong><i style={{ width: '50%' }} /></article>
        </div>

        <div className="lp-outcomes">
          <div className="total-value-card">
            <div className="total-value-heading"><small>Total value</small><strong>€225.50m</strong></div>
            <div className="value-split"><span style={{ width: '16.3%' }} /><span style={{ width: '83.7%' }} /></div>
            <div className="value-split-labels">
              <div><i className="distributed-key" /><small>Distributions</small><strong>€36.70m</strong></div>
              <div><i className="residual-key" /><small>Net residual value</small><strong>€188.80m</strong></div>
            </div>
          </div>
          <div className="ratio-grid">
            {[
              { label: 'DPI', value: '0.33×', fill: 16.3, note: 'Distributed / Paid-in' },
              { label: 'RVPI', value: '1.68×', fill: 83.7, note: 'Residual / Paid-in' },
              { label: 'TVPI', value: '2.00×', fill: 100, note: 'DPI + RVPI' },
            ].map((ratio) => (
              <article key={ratio.label}>
                <div className="ratio-ring" style={{ background: `conic-gradient(var(--blue) ${ratio.fill}%, #d9d7ce ${ratio.fill}% 100%)` }}><span>{ratio.label}</span></div>
                <strong>{ratio.value}</strong><small>{ratio.note}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="methodology" className="methodology-section">
        <div className="section-shell reveal">
          <header className="method-heading">
            <p className="section-kicker">05 / Methodology</p>
            <h2>Built to be<br /><em>followed.</em></h2>
            <p>Good reporting does more than surface a number. It makes the logic behind that number easy to inspect, challenge and reproduce.</p>
          </header>
          <div className="method-list">
            {methods.map((method, index) => (
              <details key={method.title} open={index === 0}>
                <summary><span>0{index + 1}</span><strong>{method.title}</strong><i>+</i></summary>
                <div><code>{method.formula}</code><p>{method.copy}</p></div>
              </details>
            ))}
          </div>
          <div className="method-note">
            <span>Model conventions</span>
            <p>Gross returns · EUR · XIRR timing · Fully diluted ownership · Fictitious portfolio · Reporting date 28 August 2026</p>
          </div>
        </div>
      </section>

      <footer>
        <div className="section-shell footer-grid">
          <div><span className="footer-mark">A</span><p>Project A Venture Fund VII<br />Reporting Case Study</p></div>
          <div><small>Case focus</small><p>Portfolio performance<br />Series E impact<br />LP reporting</p></div>
          <div><small>Approach</small><p>Analytical rigor<br />Auditability<br />Modern data UX</p></div>
          <div className="footer-end"><a href="#top">Back to top ↑</a><small>Prepared for recruiting purposes</small></div>
        </div>
      </footer>
    </main>
  );
}
