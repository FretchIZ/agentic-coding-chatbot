'use client';

const SUPERSCRIPTS: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '⁺', 'n': 'ⁿ' };

function latexToPlain(text: string): string {
  let s = text;

  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => '\n' + latexLine(m.trim()) + '\n');
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => latexLine(m.trim()));

  return s;
}

const LATEX_SYMBOLS: Record<string, string> = {
  partial: '∂', nabla: '∇', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ',
  epsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ',
  tau: 'τ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  infty: '∞', hbar: 'ħ', cdot: '·', times: '×', to: '→', rightarrow: '→',
  leftarrow: '←', Rightarrow: '⇒', approx: '≈', neq: '≠', leq: '≤', geq: '≥',
  sum: '∑', int: '∫', prod: '∏', in: '∈', subset: '⊂', supset: '⊃',
};

function latexLine(s: string): string {
  let result = '';
  let i = 0;
  while (i < s.length) {
    if (s[i] === '\\') {
      const start = i + 1;
      let j = start;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      const name = s.slice(start, j);
      if (LATEX_SYMBOLS[name]) {
        result += LATEX_SYMBOLS[name];
        i = j;
        continue;
      }
      if (name === 'frac') {
        if (s[j] === '{') {
          const [a, next1] = latexReadGroup(s, j);
          if (next1 < s.length && s[next1] === '{') {
            const [b, next2] = latexReadGroup(s, next1);
            result += latexLine(a) + '/' + latexLine(b);
            i = next2;
            continue;
          }
          i = next1;
          continue;
        }
      }
      result += s[i];
      i++;
    } else if (s[i] === '^') {
      if (i + 1 < s.length && s[i + 1] === '{') {
        const [content, next] = latexReadGroup(s, i + 1);
        result += [...content].map((c) => SUPERSCRIPTS[c] || c).join('');
        i = next;
      } else if (i + 1 < s.length && /\d/.test(s[i + 1])) {
        result += SUPERSCRIPTS[s[i + 1]] || s[i + 1];
        i += 2;
      } else {
        result += s[i];
        i++;
      }
    } else if (s[i] === '_') {
      if (i + 1 < s.length && s[i + 1] === '{') {
        const [content, next] = latexReadGroup(s, i + 1);
        result += content;
        i = next;
      } else {
        result += s[i];
        i++;
      }
    } else if (s[i] === '{' || s[i] === '}') {
      i++;
    } else {
      result += s[i];
      i++;
    }
  }
  return result;
}

function latexReadGroup(s: string, start: number): [string, number] {
  if (s[start] !== '{') return ['', start + 1];
  let depth = 1;
  let i = start + 1;
  const buf: string[] = [];
  while (i < s.length && depth > 0) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') depth--;
    if (depth > 0) buf.push(s[i]);
    i++;
  }
  return [buf.join(''), i];
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderInline(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-xs font-mono">$1</code>');
  result = result.replace(/\n/g, '<br/>');
  return result;
}

export default function Markdown({ content }: { content: string }) {
  content = latexToPlain(content);
  const blocks: string[] = [];
  const lines = content.split('\n');
  let inCode = false;
  let codeLang = '';
  let codeBuf: string[] = [];
  let textBuf: string[] = [];
  let inTable = false;
  let tableBuf: string[] = [];

  function flushText() {
    if (!textBuf.length) return;
    const txt = textBuf.join('\n');

    if (/^#{1,3}\s/.test(txt)) {
      const level = txt.match(/^#{1,3}/)![0].length;
      const text = txt.replace(/^#{1,3}\s/, '');
      blocks.push(`<h${level} class="font-bold mt-4 mb-2">${renderInline(text)}</h${level}>`);
    } else if (/^\d+\.\s/.test(txt)) {
      const items = txt.split('\n').filter((l) => /^\d+\.\s/.test(l));
      blocks.push('<ol class="list-decimal ml-5 mb-2">' + items.map((l) => `<li class="text-sm">${renderInline(l.replace(/^\d+\.\s/, ''))}</li>`).join('') + '</ol>');
    } else if (/^[-*]\s/.test(txt)) {
      const items = txt.split('\n').filter((l) => /^[-*]\s/.test(l));
      blocks.push('<ul class="list-disc ml-5 mb-2">' + items.map((l) => `<li class="text-sm">${renderInline(l.replace(/^[-*]\s/, ''))}</li>`).join('') + '</ul>');
    } else if (/^>\s/.test(txt)) {
      const text = txt.replace(/^>\s?/gm, '').trim();
      blocks.push(`<blockquote class="border-l-4 border-muted-foreground/30 pl-4 italic mb-2 text-sm">${renderInline(text)}</blockquote>`);
    } else if (/^---/.test(txt)) {
      blocks.push('<hr class="my-4 border-muted-foreground/20"/>');
    } else {
      txt.split('\n').filter(Boolean).forEach((l) => {
        blocks.push(`<p class="mb-2 text-sm leading-relaxed">${renderInline(l)}</p>`);
      });
    }
    textBuf = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCode) {
        flushText();
        inCode = true;
        codeLang = line.slice(3).trim();
        codeBuf = [];
      } else {
        const lang = codeLang ? `language-${escapeHtml(codeLang)}` : '';
        blocks.push(`<pre class="mb-3 overflow-x-auto rounded-lg bg-muted p-4 text-xs font-mono leading-relaxed"><code class="${lang}">${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
        inCode = false;
        codeLang = '';
        codeBuf = [];
      }
      continue;
    }

    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        flushText();
        inTable = true;
        tableBuf = [];
      }
      tableBuf.push(line);
      continue;
    }

    if (inTable) {
      if (tableBuf.length >= 2 && /^[\s:|_-]+$/.test(line)) {
        continue;
      }
      if (!line.startsWith('|')) {
        blocks.push(renderTable(tableBuf));
        inTable = false;
        tableBuf = [];
        textBuf.push(line);
        continue;
      }
      tableBuf.push(line);
      continue;
    }

    textBuf.push(line);
  }

  flushText();

  if (inTable && tableBuf.length > 0) {
    blocks.push(renderTable(tableBuf));
  }

  if (inCode && codeBuf.length > 0) {
    blocks.push(`<pre class="mb-3 overflow-x-auto rounded-lg bg-muted p-4 text-xs font-mono leading-relaxed"><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
  }

  return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: blocks.join('\n') }} />;
}

function renderTable(rows: string[]): string {
  if (rows.length < 2) return '';
  const headers = parseTableRow(rows[0]);
  const bodyRows = rows.slice(2).filter((r) => r.startsWith('|')).map(parseTableRow);
  let html = '<div class="overflow-x-auto mb-3"><table class="min-w-full text-sm border-collapse">';
  html += '<thead><tr>' + headers.map((h) => `<th class="border border-muted-foreground/20 bg-muted px-3 py-1.5 text-left font-medium">${h}</th>`).join('') + '</tr></thead>';
  if (bodyRows.length > 0) {
    html += '<tbody>' + bodyRows.map((row) => '<tr>' + row.map((cell) => `<td class="border border-muted-foreground/20 px-3 py-1.5">${cell}</td>`).join('') + '</tr>').join('') + '</tbody>';
  }
  html += '</table></div>';
  return html;
}

function parseTableRow(row: string): string[] {
  return row.split('|').slice(1, -1).map((c) => c.trim());
}
