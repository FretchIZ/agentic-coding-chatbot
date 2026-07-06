'use client';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-xs font-mono">$1</code>')
    .replace(/\n/g, '<br/>');
}

export default function Markdown({ content }: { content: string }) {
  const blocks: string[] = [];
  let i = 0;
  let inCode = false;
  let codeLang = '';
  let codeBuf: string[] = [];
  let textBuf: string[] = [];

  function flushText() {
    if (textBuf.length) {
      const txt = textBuf.join('\n');
      // headings
      if (/^#{1,3}\s/.test(txt)) {
        const level = txt.match(/^#{1,3}/)![0].length;
        const text = txt.replace(/^#{1,3}\s/, '');
        blocks.push(`<h${level} class="font-bold mt-4 mb-2">${renderInline(text)}</h${level}>`);
      } else if (/^\d+\.\s/.test(txt)) {
        blocks.push(`<li class="ml-4 list-decimal">${renderInline(txt.replace(/^\d+\.\s/, ''))}</li>`);
      } else if (/^[-*]\s/.test(txt)) {
        blocks.push(`<li class="ml-4 list-disc">${renderInline(txt.replace(/^[-*]\s/, ''))}</li>`);
      } else {
        blocks.push(`<p class="mb-2 text-sm leading-relaxed">${renderInline(txt)}</p>`);
      }
      textBuf = [];
    }
  }

  const lines = content.split('\n');
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      inCode = !inCode;
      if (inCode) {
        flushText();
        codeLang = line.slice(3).trim();
        codeBuf = [];
      } else {
        blocks.push(`<pre class="mb-3 overflow-x-auto rounded-lg bg-muted p-4 text-xs"><code class="language-${escapeHtml(codeLang)}">${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
        codeLang = '';
        codeBuf = [];
      }
    } else if (inCode) {
      codeBuf.push(line);
    } else {
      textBuf.push(line);
    }
    i++;
  }
  flushText();
  if (codeBuf.length) {
    blocks.push(`<pre class="mb-3 overflow-x-auto rounded-lg bg-muted p-4 text-xs"><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
  }

  return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: blocks.join('\n') }} />;
}
