export interface EditorPosition {
  lineNumber: number;
  column: number;
}

export interface EditorRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface EditorFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

export interface EditorChange {
  range: EditorRange;
  text: string;
  oldText: string;
}

export interface EditorOptions {
  language?: string;
  theme?: 'vs-dark' | 'vs' | 'hc-black';
  readOnly?: boolean;
  fontSize?: number;
  tabSize?: number;
  wordWrap?: 'on' | 'off';
  minimap?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative';
}

export interface EditorInstance {
  getValue(): string;
  setValue(value: string): void;
  getPosition(): EditorPosition;
  setPosition(position: EditorPosition): void;
  getSelection(): EditorRange | null;
  setSelection(range: EditorRange): void;
  focus(): void;
  dispose(): void;
  onDidChangeContent(callback: (change: EditorChange) => void): () => void;
  addMarker(options: { line: number; message: string; severity: 'error' | 'warning' | 'info' }): void;
  clearMarkers(): void;
}

export interface EditorProvider {
  create(container: HTMLElement, options?: EditorOptions): Promise<EditorInstance>;
  setModelContent(content: string): void;
  getModelContent(): string;
}
