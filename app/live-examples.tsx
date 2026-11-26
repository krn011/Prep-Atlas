'use client';

import { memo, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { BookOpen, ShoppingBag, Star } from 'lucide-react';
import { experimentCases } from '../content/experiments';

function Product({ boundary }: { boundary: boolean }) {
  const [phase, setPhase] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const ready = !boundary || phase === 2;
  return <>
    <div className="sample-head"><b>Paper Goods</b><span><ShoppingBag size={15}/> Bag · {quantity}</span></div>
    {boundary && phase === 0 ? <div className="sample-empty"><BookOpen size={30}/><p>The browser is waiting for the product page.</p></div> :
      <div className="sample-product"><div className="book-cover" aria-hidden="true">FIELD<br/>NOTES<i /></div><div><small>Softcover · 48 pages</small><h3>Field notebook</h3><p>₹180</p><button className="button button-dark" disabled={!ready} onClick={() => setQuantity(n => n+1)}>Add to bag</button></div></div>}
    <div className="sample-controls">{boundary && phase < 2 && <button className="button button-light" onClick={() => setPhase(p => p+1)}>{phase === 0 ? 'Deliver page HTML' : 'Hydrate the button'}</button>}
    <output>{boundary && phase === 0 ? 'Step through a simulated page load.' : !ready ? 'The title and button are visible. The click handler is still loading.' : quantity ? 'React committed the new bag count. The product title stayed the same.' : 'Click Add to bag and watch the header.'}</output></div>
  </>;
}

function makeStore() {
  let state = { count: 2, dark: false };
  const listeners = new Set<() => void>();
  return {
    read: () => state,
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    update: (patch: Partial<typeof state>) => { state = {...state,...patch}; listeners.forEach(fn => fn()); }
  };
}
type Store = ReturnType<typeof makeStore>;
const Badge = memo(function Badge({store}:{store:Store}) {
  const count = useSyncExternalStore(store.subscribe, () => store.read().count, () => 2);
  return <span><ShoppingBag size={15}/> Bag · {count}</span>;
});
function Selectors() {
  const [store] = useState(makeStore);
  const dark = useSyncExternalStore(store.subscribe, () => store.read().dark, () => false);
  const [note,setNote] = useState('Change the theme first. Watch the bag count.');
  return <div className={'sample-shop '+(dark?'sample-night':'')}>
    <div className="sample-head"><b>Paper Goods</b><Badge store={store}/></div>
    <div className="sample-product"><div className="book-cover" aria-hidden="true">FIELD<br/>NOTES<i /></div><div><h3>Field notebook</h3>
      <button className="button button-dark" onClick={() => {store.update({count:store.read().count+1});setNote('The count changed. The bag badge received a new value.');}}>Add to bag</button></div></div>
    <div className="sample-controls"><button className="button button-light" onClick={() => {store.update({dark:!dark});setNote('Only the theme selection changed. The bag badge kept its count.');}}>Use {dark?'light':'dark'} theme</button><output>{note}</output></div>
  </div>;
}
function SearchSample() {
  const [query,setQuery] = useState('');
  const [active,setActive] = useState('');
  const [delay,setDelay] = useState(true);
  useEffect(() => {
    if (!delay) { setActive(query); return; }
    const timer = setTimeout(() => setActive(query),350);
    return () => clearTimeout(timer);
  },[query,delay]);
  const items = ['Field notebook','Pocket atlas','Map print','Map journal'].filter(x => x.toLowerCase().includes(active.toLowerCase()));
  return <><div className="sample-head"><b>Stationery catalog</b><label><input type="checkbox" checked={delay} onChange={e=>setDelay(e.target.checked)}/> Wait 350 ms</label></div>
    <div className="sample-body"><label>Search products<input type="search" value={query} placeholder="Try “map”" onChange={e=>setQuery(e.target.value)}/></label>
    <ul>{items.map(x=><li key={x}>{x}</li>)}</ul><output>{active !== query ? 'Waiting for a pause…' : items.length+' matches for '+(active || 'all products')}</output></div></>;
}
function RowList({byId}:{byId:boolean}) {
  const [rows,setRows] = useState(['Mira','Dev']);
  return <div className="sample-body">{rows.map((name,i)=><label key={byId?name:i}>{name}<input defaultValue="" placeholder={'Note for '+name}/></label>)}
    <button className="button button-dark" onClick={()=>setRows([...rows].reverse())}>Reverse rows</button></div>;
}
function Keys() {
  const [byId,setById] = useState(true);
  return <><div className="sample-head"><b>Team notes</b><label><input type="checkbox" checked={byId} onChange={e=>setById(e.target.checked)}/> Key by ID</label></div><RowList key={String(byId)} byId={byId}/><div className="sample-controls">Write a note for Mira and reverse the rows. Switching key mode starts a fresh trial.</div></>;
}
function StarSample() {
  const [status,setStatus] = useState<'idle'|'pending'|'saved'|'failed'>('idle');
  const [starred,setStarred] = useState(false);
  const [offline,setOffline] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  function save() {
    const before = starred;
    setStarred(!before);setStatus('pending');
    timer.current=setTimeout(()=>{
      if(offline) setStarred(before);
      setStatus(offline?'failed':'saved');
    },900);
  }
  return <><div className="sample-head"><b>My projects</b><label><input type="checkbox" checked={offline} disabled={status==='pending'} onChange={e=>setOffline(e.target.checked)}/> Simulate failed save</label></div>
  <div className="sample-product"><BookOpen size={34}/><div><small>Study collection</small><h3>Interview notebook</h3><button className="button button-light" aria-pressed={starred} disabled={status==='pending'} onClick={save}><Star size={16} fill={starred?'currentColor':'none'}/>{starred?'Starred':'Star project'}</button></div></div>
  <div className="sample-controls"><output>{{idle:'Click the star and watch it change before confirmation.',pending:'Saving… the star already reflects your click.',saved:'Saved. The server simulation confirmed your change.',failed:'Save failed. The star returned to its previous state.'}[status]}</output></div></>;
}
function Rooms() {
  const [room,setRoom]=useState('General');
  const [messages,setMessages]=useState<string[]>([]);
  const [last,setLast]=useState('');
  const [bus]=useState(()=>new EventTarget());
  useEffect(()=>{
    const receive=()=>setMessages(prev=>[...prev.slice(-2),'New message in '+room]);
    bus.addEventListener(room,receive);
    return ()=>bus.removeEventListener(room,receive);
  },[bus,room]);
  return <><div className="sample-head"><b>Team inbox</b><span>Connected · {room}</span></div><div className="sample-body">
    <div className="sample-actions">{['General','Support'].map(name=><button className="button button-light" key={name} aria-pressed={name===room} onClick={()=>{setRoom(name);setMessages([]);setLast('');}}>Join {name}</button>)}</div>
    <ul>{messages.length?messages.map((m,i)=><li key={i}>{m}</li>):<li>No messages received.</li>}</ul>
    <div className="sample-actions">{['General','Support'].map(name=><button key={name} className="button button-light" onClick={()=>{bus.dispatchEvent(new Event(name));setLast(name===room?'The active listener received the message.':'No listener for '+name+'. The inbox stayed quiet.');}}>Ping {name}</button>)}</div><output>{last || 'Switch rooms, then ping the room you just left.'}</output></div></>;
}

function CacheSample() {
  const [price, setPrice] = useState(180);
  const [cached, setCached] = useState<number | null>(null);
  const [shown, setShown] = useState<number | null>(null);
  const [note, setNote] = useState('Open the product twice. See which source supplies the second price.');
  function open() {
    setShown(cached ?? price);
    setNote(cached === null ? 'Cache miss. Read the catalog price and keep a copy.' : 'Cache hit. The page used the stored copy.');
    setCached(cached ?? price);
  }
  return <><div className="sample-head"><b>Product catalog</b><span>Database · ₹{price}</span></div>
    <div className="sample-product"><div className="book-cover" aria-hidden="true">FIELD<br/>NOTES<i/></div><div><h3>Field notebook</h3>
    <p>{shown === null ? 'Open the product to see its price.' : 'Displayed price · ₹'+shown}</p><button className="button button-dark" onClick={open}>Open product</button></div></div>
    <div className="sample-controls"><button className="button button-light" onClick={()=>{setPrice(n=>n+10);setNote('The database price changed. Open the product to check what a reader sees.');}}>Raise catalog price ₹10</button>
    <button disabled={cached===null} className="button button-light" onClick={()=>{setCached(null);setNote('Cached copy removed. The next read will fetch the catalog price.');}}>Clear cache</button><output>{note}</output></div></>;
}
function Transfer() {
  const [saved,setSaved]=useState([100,40]);
  const [draft,setDraft]=useState<number[] | null>(null);
  const [message,setMessage]=useState('Move 10 credits between two wallets.');
  return <><div className="sample-head"><b>Credit transfer</b><span>Committed total · {saved[0]+saved[1]}</span></div><div className="sample-body">
    <div className="case-flow">{['Mira','Dev'].map((name,i)=><div key={name}><small>{name}</small><b>{saved[i]} credits</b>{draft&&<span>Pending balance · {draft[i]}</span>}</div>)}</div>
    <div className="sample-actions">{draft ? <><button className="button button-dark" onClick={()=>{setSaved([draft[0],draft[1]+10]);setDraft(null);setMessage('Credit succeeded. Both writes committed together.');}}>Credit Dev &amp; commit</button>
    <button className="button button-light" onClick={()=>{setDraft(null);setMessage('Credit failed. The pending debit was rolled back.');}}>Fail &amp; roll back</button></> :
    <button disabled={saved[0]<10} className="button button-dark" onClick={()=>{setDraft([saved[0]-10,saved[1]]);setMessage('Debit staged. Compare the pending and committed balances.');}}>Debit Mira by 10</button>}</div><output>{message}</output></div></>;
}
function Worklist() {
  const [jobs,setJobs]=useState([1,2,3]);
  const [next,setNext]=useState(4);
  const [fifo,setFifo]=useState(true);
  const [last,setLast]=useState('Which ticket will leave first?');
  function take() {
    const index=fifo?0:jobs.length-1;
    setLast('Removed ticket '+jobs[index]+(fifo?' from the front.':' from the back.'));
    setJobs(jobs.filter((_,i)=>i!==index));
  }
  return <><div className="sample-head"><b>Ticket desk</b><label><input type="checkbox" checked={fifo} onChange={e=>setFifo(e.target.checked)}/> Queue mode</label></div>
    <div className="sample-body"><small>{fifo?'Queue · oldest first':'Stack · newest first'}</small><div className="ticket-strip">{jobs.length?jobs.map(n=><span key={n}>#{n}</span>):'No tickets waiting.'}</div>
    <div className="sample-actions"><button className="button button-light" disabled={jobs.length>=10} onClick={()=>{setJobs([...jobs,next]);setNext(next+1);}}>Add ticket</button>
    <button className="button button-dark" disabled={!jobs.length} onClick={take}>Take next ticket</button></div><output>{last}</output></div></>;
}

function Sandbox({id}:{id:string}) {
  const [choice,setChoice]=useState(0);
  const cases=experimentCases.get(id)!;
  const [label,,before,after,note]=cases[choice];
  return <><div className="sample-head"><b>Compare two cases</b></div><div className="sample-body">
    <div className="sample-actions">{cases.map(([name],i)=><button key={name} className="button button-light" aria-pressed={i===choice} onClick={()=>setChoice(i)}>{name}</button>)}</div>
    <div className="case-flow" key={label}>{[before,after].map((list,i)=><div key={i}><small>{i?'Result':'Starting point'}</small>{list.map((v,j)=><span key={j}>{v}</span>)}</div>)}</div><output>{note}</output></div></>;
}
export function LiveExample({id}:{id:string}) {
  const [run,setRun]=useState(0);
  const previews: Record<string,[string,React.ReactNode]>={
    'next-boundary':['When does the button start working?',<Product boundary/>],
    'react-render':['Add a notebook to your bag',<Product boundary={false}/>],
    state:['What updates when the theme changes?',<Selectors/>],
    effects:['Which room is listening?',<Rooms/>],
    debounce:['Try a search that waits for you',<SearchSample/>],
    optimistic:['What happens when a save fails?',<StarSample/>],
    'transactions':['Can half a transfer survive?',<Transfer/>],
    'stack-queue':['Which ticket comes out next?',<Worklist/>],
    'cache-design':['Why does the old price still show?',<CacheSample/>],
    'stable-keys':['Can a note follow the wrong person?',<Keys/>],
  };
  const entry=previews[id];
  if(!entry && !experimentCases.has(id)) return null;
  return <section className="live-example"><header><div><small>{entry?'Working example':'Visual example'}</small><h2>{entry?.[0] || 'Try both cases'}</h2></div><button className="text-button" onClick={()=>setRun(n=>n+1)}>Reset</button></header>
    <div className="sample-window" key={run}>{entry?.[1] || <Sandbox id={id}/>}</div></section>;
}

const challenges: Record<string, string> = {
  'next-boundary': 'Deliver the HTML. Find the product title before the button works. Then hydrate the button and put two notebooks in the bag.',
  'react-render': 'Put three notebooks in the bag. Identify the text that changed after each click.',
  state: 'Start with two items. Switch the theme twice, then add one notebook. Which action changed the badge?',
  effects: 'Join Support. Ping General and then Support. Only the second ping should appear in the inbox.',
  debounce: 'Type “map” quickly, then clear the search and turn off the delay. Compare when the catalog changes.',
  optimistic: 'Star the project successfully. Then turn on the failed save and remove the star. Watch what comes back.',
  'stable-keys': 'Give Mira a note and reverse the rows. Repeat with index keys. Which person ends up with the note?',
  transactions: 'Fail a transfer after the debit. Check both balances. Repeat and commit. The combined balance should stay at 140.',
  'stack-queue': 'Take ticket 1 in queue mode. Switch to stack mode, add a ticket, and predict which ticket comes out next.',
  'cache-design': 'Make the displayed price differ from the catalog price. Then bring them back into sync using the cache controls.',
};
export function HandsOnPractice({id}:{id:string}) {
  const [open,setOpen]=useState(false);
  if (!challenges[id]) return null;
  return <div className="exercise"><h3>Hands-on challenge</h3><p>{challenges[id]}</p>
    <button className="button button-light" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>{open?'Close practice area':'Try the challenge'}</button>
    {open && <LiveExample id={id}/>}
  </div>;
}
