import type { ReactNode } from 'react';

function inline(input: string) {
  return input.split(/(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s<>]+)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
    if (/^https?:\/\//.test(part)) return <a key={index} href={part} target="_blank" rel="noreferrer">{part}</a>;
    return part;
  });
}

export function Blueprint({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n');
  const output: ReactNode[] = [];
  for (let cursor = 0; cursor < lines.length;) {
    const index = cursor;
    const line = lines[cursor++].trim();
    if (!line || line === '---') continue;
    if (line.startsWith('```')) {
      const code = [];
      while (cursor < lines.length && !lines[cursor].trim().startsWith('```')) code.push(lines[cursor++]);
      cursor++;
      output.push(<pre key={index}><code>{code.join('\n')}</code></pre>);
    } else if (line.startsWith('|')) {
      const readCells = (row: string) => row.trim().replace(/^\||\|$/g, '').split('|').map(value => value.trim());
      const header = readCells(line);
      const rows: string[][] = [];
      while (cursor < lines.length && lines[cursor].trim().startsWith('|')) {
        const row = readCells(lines[cursor++]);
        if (row.every(cell => /^:?-+:?$/.test(cell))) continue;
        rows.push(row);
      }
      output.push(<div className="table-scroll" key={index}><table><thead><tr>{header.map((cell, cellIndex) => <th scope="col" key={cellIndex}>{inline(cell)}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>);
    } else if (/^#{2,6} /.test(line)) {
      output.push(<h3 key={index} data-source-line={index}>{line.replace(/^#+ /, '')}</h3>);
    } else if (/^(?:[-*] |\d+\. )/.test(line)) {
      const ordered = /^\d/.test(line);
      const matcher = ordered ? /^\d+\. / : /^[-*] /;
      const items = [line.replace(matcher, '')];
      while (cursor < lines.length && matcher.test(lines[cursor].trim())) items.push(lines[cursor++].trim().replace(matcher, ''));
      const children = items.map((item, itemIndex) => <li key={itemIndex} data-source-line={index + itemIndex}>{inline(item)}</li>);
      output.push(ordered ? <ol key={index} start={Number.parseInt(line, 10)}>{children}</ol> : <ul key={index}>{children}</ul>);
    } else {
      output.push(<p key={index} data-source-line={index}>{inline(line)}</p>);
    }
  }
  return <div className="blueprint-copy">{output}</div>;
}
