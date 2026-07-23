import { useState } from 'react';

const FIRST = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Barbara','William','Elizabeth','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Christopher','Karen','Charles','Lisa','Daniel','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra'];
const LAST = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','White','Harris','Clark','Lewis','Robinson','Walker','Young','Allen','King'];
const DOMAINS = ['gmail.com','yahoo.com','outlook.com','hotmail.com','proton.me','icloud.com'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function genPerson(i: number) {
  const first = pick(FIRST);
  const last = pick(LAST);
  return { id: i + 1, name: `${first} ${last}`, email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@${pick(DOMAINS)}`, phone: `+1${String(2000000000 + Math.floor(Math.random() * 999999999))}`, city: pick(['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','Austin']), age: 18 + Math.floor(Math.random() * 52) };
}

export function FakeDataGenerator() {
  const [count, setCount] = useState(5);
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [data, setData] = useState('');

  const generate = () => {
    const people = Array.from({ length: count }, (_, i) => genPerson(i));
    if (format === 'json') {
      setData(JSON.stringify(people, null, 2));
    } else {
      setData(['id,name,email,phone,city,age', ...people.map(p => `${p.id},${p.name},${p.email},${p.phone},${p.city},${p.age}`)].join('\n'));
    }
  };

  const ic = "w-full bg-theme-surface border border-theme-border/20 rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-icon/50 font-mono";
  const tb = (f: string) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${format === f ? 'bg-theme-icon/10 text-theme-icon border border-theme-icon/20' : 'bg-theme-surface border border-theme-border/20 text-theme-text/60 hover:text-theme-text'}`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <label className="text-xs text-theme-text/60">Count: <input type="number" min={1} max={100} value={count} onChange={e => setCount(Number(e.target.value))} className="w-16 bg-theme-surface border border-theme-border/20 rounded-lg px-2 py-1 text-xs text-theme-text ml-1" /></label>
        <button onClick={() => setFormat('json')} className={tb('json')}>JSON</button>
        <button onClick={() => setFormat('csv')} className={tb('csv')}>CSV</button>
        <button onClick={generate} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-icon text-white hover:bg-theme-icon/90 transition-colors">Generate</button>
      </div>
      {data && (
        <div>
          <textarea readOnly value={data} rows={10} className={ic} />
          <button onClick={() => navigator.clipboard.writeText(data)} className="mt-1 text-[10px] text-theme-icon hover:underline">Copy</button>
        </div>
      )}
    </div>
  );
}
