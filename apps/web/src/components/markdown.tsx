'use client';

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
