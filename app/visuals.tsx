'use client';

import { useState } from 'react';
import { ArrowDown, ArrowRight, Clock3, Server } from 'lucide-react';

const customers = [{ id: 1, name: 'Mira' }, { id: 2, name: 'Dev' }];
const orders = [{ id: 101, customer: 1 }, { id: 102, customer: null }];
const joinModes = {
  INNER: 'Keep only pairs that match on customer ID.',
  LEFT: 'Also keep Dev, who has no order.',
  RIGHT: 'Also keep order 102, which has no customer.',
  FULL: 'Keep matching pairs and unmatched rows from both sides.',
} as const;

type JoinMode = keyof typeof joinModes;

export function JoinPlayground() {
  const [mode, setMode] = useState<JoinMode>('LEFT');
  const left = mode === 'LEFT' || mode === 'FULL';
  const right = mode === 'RIGHT' || mode === 'FULL';
  const matched = customers.flatMap(customer => orders
    .filter(order => order.customer === customer.id)
    .map(order => [customer.name, String(order.id)]));
  const rows = [
    ...matched,
    ...(left ? customers.filter(customer => !orders.some(order => order.customer === customer.id)).map(customer => [customer.name, 'NULL']) : []),
    ...(right ? orders.filter(order => !customers.some(customer => customer.id === order.customer)).map(order => ['NULL', String(order.id)]) : []),
  ];

  return <section className="lesson-card specialist">
    <div className="section-heading"><h2>Change the join</h2><p>Start with two tables, then try each join to see which rows survive.</p></div>
    <div className="join-tables">
      <div className="sample-table"><table><caption>customers</caption><thead><tr><th scope="col">ID</th><th scope="col">Name</th></tr></thead><tbody>{customers.map(item => <tr className={item.id === 1 ? 'matching-row' : ''} key={item.id}><td>{item.id}</td><td>{item.name}</td></tr>)}</tbody></table></div>
      <div className="sample-table"><table><caption>orders</caption><thead><tr><th scope="col">ID</th><th scope="col">Customer ID</th></tr></thead><tbody>{orders.map(item => <tr className={item.customer === 1 ? 'matching-row' : ''} key={item.id}><td>{item.id}</td><td>{item.customer ?? 'NULL'}</td></tr>)}</tbody></table></div>
    </div>
    <div className="join-modes" aria-label="Join type">{(Object.keys(joinModes) as JoinMode[]).map(item => <button type="button" className="button button-light" aria-pressed={mode === item} onClick={() => setMode(item)} key={item}>{item}</button>)}</div>
    <div className="sample-table join-result"><table><caption><ArrowDown size={14} aria-hidden="true" /> {mode} JOIN result</caption><thead><tr><th scope="col">Customer</th><th scope="col">Order ID</th></tr></thead><tbody>
      {rows.map(([name, order]) => <tr key={name + order}><td className={name === 'NULL' ? 'null-cell' : ''}>{name}</td><td className={order === 'NULL' ? 'null-cell' : ''}>{order}</td></tr>)}
    </tbody></table></div>
    <p className="specialist-caption" aria-live="polite">{joinModes[mode]} {rows.length} {rows.length === 1 ? 'row' : 'rows'} returned.</p>
  </section>;
}

const strategies = [
  { name: 'CSR', title: 'Client-side rendering', when: 'In the browser', flow: ['HTML shell', 'Load JavaScript', 'Build the UI'], receives: 'An HTML shell followed by JavaScript', fresh: 'When the browser fetches data' },
  { name: 'SSR', title: 'Server-side rendering', when: 'On each request', flow: ['Request page', 'Render on server', 'Send the HTML'], receives: 'HTML for this request', fresh: 'On a new request in this model' },
  { name: 'SSG', title: 'Static site generation', when: 'At build time', flow: ['Run build', 'Generate HTML', 'Serve the file'], receives: 'Previously built HTML', fresh: 'After building and deploying again' },
  { name: 'ISR', title: 'Incremental static regeneration', when: 'Before and between requests', flow: ['Serve cached page', 'Revalidate', 'Replace cached output'], receives: 'Cached HTML while regeneration may run', fresh: 'After successful regeneration' },
];

export function RenderingGrid() {
  const [active, setActive] = useState('SSR');
  const selected = strategies.find(strategy => strategy.name === active)!;
  return <section className="lesson-card specialist">
    <div className="section-heading"><h2>When is the HTML made?</h2><p>Compare four ways to produce a page. Select one to read what the visitor receives.</p></div>
    <div className="rendering-grid">{strategies.map(item => <button key={item.name} aria-pressed={active === item.name} onClick={() => setActive(item.name)}>
      <span>{item.name}</span><b>{item.title}</b><small><Clock3 size={13} aria-hidden="true" /> {item.when}</small>
      <ul>{item.flow.map((label, index) => <li key={label}>{index > 0 && <ArrowDown size={12} aria-hidden="true" />}{label}</li>)}</ul>
    </button>)}</div>
    <div className="render-result" aria-live="polite"><Server size={19} aria-hidden="true" /><div><b>{selected.name} · Browser receives</b><p>{selected.receives}</p></div><ArrowRight size={17} aria-hidden="true" /><div><b>Data refresh</b><p>{selected.fresh}</p></div></div>
  </section>;
}

export function GrowthChart() {
  const [count, setCount] = useState(16);
  const values = [
    { label: 'Logarithmic', notation: 'log₂ n', value: Math.log2(count) },
    { label: 'Linear', notation: 'n', value: count },
    { label: 'Quadratic', notation: 'n²', value: count * count },
  ];
  return <section className="lesson-card specialist">
    <div className="section-heading"><h2>See how the work grows</h2><p>These formulas show the shape of growth. Real runtimes also depend on constants and the work each step does.</p></div>
    <label className="range-label">Input size <output>{count}</output><input type="range" min="2" max="64" value={count} onChange={event => setCount(Number(event.target.value))} /></label>
    <ul className="growth-bars">{values.map(item => <li key={item.label}><span><b>{item.label}</b> <code>{item.notation}</code></span><div aria-hidden="true"><i style={{ width: `${Math.log2(item.value + 1) / 12.01 * 100}%` }} /></div><output>{Number.isInteger(item.value) ? item.value : item.value.toFixed(1)}</output></li>)}</ul>
    <p className="specialist-caption">Bar lengths use a logarithmic scale so small values stay visible.</p>
  </section>;
}
