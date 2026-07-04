export class MarkdownEditor {
  private content: string = '';

  setContent(content: string): void {
    this.content = content;
  }

  getContent(): string {
    return this.content;
  }

  insertHeading(level: 1 | 2 | 3 | 4 | 5 | 6, text: string): void {
    this.content += `${'#'.repeat(level)} ${text}\n\n`;
  }

  insertBold(text: string): string {
    return `**${text}**`;
  }

  insertItalic(text: string): string {
    return `*${text}*`;
  }

  insertCode(text: string, language?: string): string {
    return language ? `\`\`\`${language}\n${text}\n\`\`\`` : `\`${text}\``;
  }

  insertLink(text: string, url: string): string {
    return `[${text}](${url})`;
  }

  insertImage(alt: string, url: string): string {
    return `![${alt}](${url})`;
  }

  insertList(items: string[], ordered: boolean = false): void {
    this.content += items.map((item, i) => ordered ? `${i + 1}. ${item}` : `- ${item}`).join('\n') + '\n\n';
  }

  toHtml(): string {
    let html = this.content;
    html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img alt="$1" src="$2" />');
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    return html;
  }

  extractCodeBlocks(): Array<{ language: string; code: string }> {
    const blocks: Array<{ language: string; code: string }> = [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(this.content)) !== null) {
      blocks.push({ language: match[1], code: match[2] });
    }
    return blocks;
  }

  getHeadingStructure(): Array<{ level: number; text: string }> {
    const headings: Array<{ level: number; text: string }> = [];
    const regex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    while ((match = regex.exec(this.content)) !== null) {
      headings.push({ level: match[1].length, text: match[2] });
    }
    return headings;
  }
}