'use client';

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

const LATEX_SYM: Record<string, string> = {
  partial: '∂', nabla: '∇', alpha: 'α', beta: 'β', gamma: 'γ',
  delta: 'δ', epsilon: 'ε', theta: 'θ', lambda: 'λ', mu: 'μ',
  pi: 'π', sigma: 'σ', tau: 'τ', phi: 'φ', psi: 'ψ', omega: 'ω',
  infty: '∞', hbar: 'ħ', cdot: '·', times: '×', to: '→',
  rightarrow: '→', leftarrow: '←', approx: '≈', neq: '≠',
  leq: '≤', geq: '≥', sum: '∑', int: '∫', circ: '°',
};

function readGroup(s: string, start: number): [string, number] {
  if (s[start] !== '{') return ['', start + 1];
  let depth = 1, i = start + 1;
  const buf: string[] = [];
  while (i < s.length && depth > 0) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') depth--;
    if (depth > 0) buf.push(s[i]);
    i++;
  }
  return [buf.join(''), i];
}

function latexLine(s: string): string {
  let out = '';
  let i = 0;
  while (i < s.length) {
    if (s[i] === '\\') {
      let j = i + 1;
      if (j < s.length && s[j] === '(') { out += '('; i = j + 1; continue; }
      if (j < s.length && s[j] === ')') { out += ')'; i = j + 1; continue; }
      if (j < s.length && s[j] === '|') { out += '|'; i = j + 1; continue; }
      if (j < s.length && /[^a-zA-Z]/.test(s[j])) { out += s[j]; i = j + 1; continue; }
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      const name = s.slice(i + 1, j);
      if (name === 'text' || name === 'mathrm') {
        if (s[j] === '{') { const [c, n] = readGroup(s, j); out += c; i = n; continue; }
        i = j; continue;
      }
      if (name === 'sqrt') {
        if (s[j] === '{') { const [c, n] = readGroup(s, j); out += '√' + c; i = n; continue; }
        out += '√'; i = j; continue;
      }
      if (LATEX_SYM[name]) { out += LATEX_SYM[name]; i = j; continue; }
      if (['sin','cos','tan','log','ln','sec','csc','cot'].includes(name)) { out += name; i = j; continue; }
      if (['left','right','big','bigg','bigl','bigr','biggl','biggr'].includes(name)) { i = j; continue; }
      if (name === 'frac') {
        if (s[j] === '{') {
          const [a, n1] = readGroup(s, j);
          if (s[n1] === '{') {
            const [b, n2] = readGroup(s, n1);
            out += latexLine(a) + '/' + latexLine(b);
            i = n2; continue;
          }
          i = n1; continue;
        }
      }
      i = j;
    } else if (s[i] === '^') {
      if (s[i + 1] === '{') {
        const [c, n] = readGroup(s, i + 1);
        out += [...c].map((ch) => SUPERSCRIPT[ch] || ch).join('');
        i = n;
      } else if (/\d/.test(s[i + 1])) {
        out += SUPERSCRIPT[s[i + 1]] || s[i + 1];
        i += 2;
      } else { out += s[i]; i++; }
    } else if (s[i] === '_') {
      if (s[i + 1] === '{') { const [, n] = readGroup(s, i + 1); i = n; }
      else i += 2;
    } else if (s[i] === '{' || s[i] === '}') { i++; }
    else { out += s[i]; i++; }
  }
  return out;
}

function latexToPlain(text: string): string {
  const [D_START, D_END] = ['\\[', '\\]'];
  const [I_START, I_END] = ['\\(', '\\)'];
  let out = '', i = 0;

  while (i < text.length) {
    const ds = text.indexOf(D_START, i);
    const is = text.indexOf(I_START, i);

    let start: number, endMarker: string, endLen: number;
    if (ds === -1 && is === -1) { out += text.slice(i); break; }
    if (is === -1 || (ds !== -1 && ds < is)) {
      start = ds; endMarker = D_END; endLen = 2;
    } else {
      start = is; endMarker = I_END; endLen = 2;
    }

    out += text.slice(i, start);
    const end = text.indexOf(endMarker, start + 2);
    if (end === -1) { out += text.slice(start); break; }
    out += latexLine(text.slice(start + 2, end).trim());
    i = end + endLen;
  }
  return out;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderInline(text: string): string {
  let r = escapeHtml(text);
  r = r.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  r = r.replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-xs font-mono">$1</code>');
  return r.replace(/\n/g, '<br/>');
}

export default function Markdown({ content }: { content: string }) {
  content = latexToPlain(content);
  const blocks: string[] = [];
  const lines = content.split('\n');
  let inCode = false, codeLang = '', codeBuf: string[] = [];
  let textBuf: string[] = [];
  let inTable = false, tableBuf: string[] = [];

  function flushText() {
    if (!textBuf.length) return;
    const t = textBuf.join('\n');
    if (/^#{1,3}\s/.test(t)) {
      const level = t.match(/^#{1,3}/)![0].length;
      blocks.push(`<h${level} class="font-bold mt-4 mb-2">${renderInline(t.replace(/^#{1,3}\s/, ''))}</h${level}>`);
    } else if (/^\d+\.\s/.test(t)) {
      const items = t.split('\n').filter((l) => /^\d+\.\s/.test(l));
      blocks.push('<ol class="list-decimal ml-5 mb-2">' + items.map((l) => `<li class="text-sm">${renderInline(l.replace(/^\d+\.\s/, ''))}</li>`).join('') + '</ol>');
    } else if (/^[-*]\s/.test(t)) {
      const items = t.split('\n').filter((l) => /^[-*]\s/.test(l));
      blocks.push('<ul class="list-disc ml-5 mb-2">' + items.map((l) => `<li class="text-sm">${renderInline(l.replace(/^[-*]\s/, ''))}</li>`).join('') + '</ul>');
    } else if (/^>\s/.test(t)) {
      blocks.push(`<blockquote class="border-l-4 border-muted-foreground/30 pl-4 italic mb-2 text-sm">${renderInline(t.replace(/^>\s?/gm, '').trim())}</blockquote>`);
    } else if (/^---/.test(t)) {
      blocks.push('<hr class="my-4 border-muted-foreground/20"/>');
    } else {
      t.split('\n').filter(Boolean).forEach((l) => blocks.push(`<p class="mb-2 text-sm leading-relaxed">${renderInline(l)}</p>`));
    }
    textBuf = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (!inCode) { flushText(); inCode = true; codeLang = line.slice(3).trim(); codeBuf = []; }
      else { blocks.push(`<pre class="mb-3 overflow-x-auto rounded-lg bg-muted p-4 text-xs font-mono leading-relaxed"><code class="${codeLang ? 'language-' + escapeHtml(codeLang) : ''}">${escapeHtml(codeBuf.join('\n'))}</code></pre>`); inCode = false; }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) { flushText(); inTable = true; tableBuf = []; }
      tableBuf.push(line); continue;
    }
    if (inTable) {
      if (tableBuf.length >= 2 && /^[\s:|_-]+$/.test(line)) continue;
      if (!line.startsWith('|')) { blocks.push(renderTable(tableBuf)); inTable = false; tableBuf = []; textBuf.push(line); continue; }
      tableBuf.push(line); continue;
    }
    textBuf.push(line);
  }

  flushText();
  if (inTable && tableBuf.length > 0) blocks.push(renderTable(tableBuf));
  if (inCode && codeBuf.length > 0) blocks.push(`<pre class="mb-3 overflow-x-auto rounded-lg bg-muted p-4 text-xs font-mono leading-relaxed"><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);

  return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: blocks.join('\n') }} />;
}

function parseRow(row: string): string[] {
  return row.split('|').slice(1, -1).map((c) => c.trim());
}

function renderTable(rows: string[]): string {
  if (rows.length < 2) return '';
  const h = parseRow(rows[0]);
  const b = rows.slice(2).filter((r) => r.startsWith('|')).map(parseRow);
  let html = '<div class="overflow-x-auto mb-3"><table class="min-w-full text-sm border-collapse">';
  html += '<thead><tr>' + h.map((c) => `<th class="border border-muted-foreground/20 bg-muted px-3 py-1.5 text-left font-medium">${c}</th>`).join('') + '</tr></thead>';
  if (b.length > 0) html += '<tbody>' + b.map((r) => '<tr>' + r.map((c) => `<td class="border border-muted-foreground/20 px-3 py-1.5">${c}</td>`).join('') + '</tr>').join('') + '</tbody>';
  return html + '</table></div>';
}
