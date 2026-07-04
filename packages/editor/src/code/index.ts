export class CodeEditor {
  private content: string = '';
  private language: string = 'javascript';
  private cursorPosition: { line: number; column: number } = { line: 0, column: 0 };
  private history: string[] = [];
  private historyIndex: number = -1;

  constructor(language?: string) {
    if (language) this.language = language;
  }

  setContent(content: string): void {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(this.content);
    this.historyIndex = this.history.length - 1;
    this.content = content;
  }

  getContent(): string {
    return this.content;
  }

  undo(): void {
    if (this.historyIndex >= 0) {
      this.content = this.history[this.historyIndex--];
    }
  }

  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.content = this.history[++this.historyIndex];
    }
  }

  insertAtCursor(text: string): void {
    const lines = this.content.split('\n');
    const line = lines[this.cursorPosition.line] || '';
    const newLine = line.slice(0, this.cursorPosition.column) + text + line.slice(this.cursorPosition.column);
    lines[this.cursorPosition.line] = newLine;
    this.setContent(lines.join('\n'));
    this.cursorPosition.column += text.length;
  }

  getLine(lineNumber: number): string {
    return this.content.split('\n')[lineNumber] || '';
  }

  syntaxHighlight(): Array<{ text: string; type: 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'operator' | 'punctuation' | 'plain' }> {
    const tokens: Array<{ text: string; type: 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'operator' | 'punctuation' | 'plain' }> = [];
    const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'class', 'new', 'this', 'async', 'await', 'try', 'catch'];
    const words = this.content.split(/(\s+|(?<=[a-zA-Z])(?=[^a-zA-Z\s])|(?<=[^a-zA-Z\s])(?=[a-zA-Z]))/);
    for (const word of words) {
      if (keywords.includes(word)) tokens.push({ text: word, type: 'keyword' });
      else if (/^["'`]/.test(word)) tokens.push({ text: word, type: 'string' });
      else if (/^\/\//.test(word)) tokens.push({ text: word, type: 'comment' });
      else if (/^\d+$/.test(word)) tokens.push({ text: word, type: 'number' });
      else tokens.push({ text: word, type: 'plain' });
    }
    return tokens;
  }

  formatCode(): string {
    const lines = this.content.split('\n');
    const formatted: string[] = [];
    let indent = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[}\]\)]/.test(trimmed)) indent = Math.max(0, indent - 1);
      formatted.push('  '.repeat(indent) + trimmed);
      if (/[\[({]$/.test(trimmed)) indent++;
    }
    return formatted.join('\n');
  }
}

export class DiffViewer {
  computeDiff(oldContent: string, newContent: string): Array<{ type: 'add' | 'remove' | 'unchanged'; line: string; lineNumber: number }> {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const result: Array<{ type: 'add' | 'remove' | 'unchanged'; line: string; lineNumber: number }> = [];
    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      if (i >= oldLines.length) result.push({ type: 'add', line: newLines[i], lineNumber: i + 1 });
      else if (i >= newLines.length) result.push({ type: 'remove', line: oldLines[i], lineNumber: i + 1 });
      else if (oldLines[i] !== newLines[i]) {
        result.push({ type: 'remove', line: oldLines[i], lineNumber: i + 1 });
        result.push({ type: 'add', line: newLines[i], lineNumber: i + 1 });
      } else result.push({ type: 'unchanged', line: oldLines[i], lineNumber: i + 1 });
    }
    return result;
  }
}