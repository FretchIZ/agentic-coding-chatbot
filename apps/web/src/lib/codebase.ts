const MAX_DIR_DEPTH = 3;
const IGNORED = new Set([
  'node_modules', '.next', '.git', 'dist', 'build', '.turbo',
  'coverage', '.vercel', 'cache', '__pycache__', '.gitignore',
]);

interface DirEntry {
  name: string;
  type: 'file' | 'dir';
  path: string;
  children?: DirEntry[];
}

export function scanProject(root: string, depth = 0): DirEntry | null {
  try {
    const fs = require('fs');
    const path = require('path');
    const stat = fs.statSync(root);
    const name = path.basename(root);
    if (IGNORED.has(name)) return null;
    if (depth > MAX_DIR_DEPTH) return { name, type: 'dir', path: root };
    if (stat.isFile()) {
      const ext = path.extname(root);
      const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.css', '.html', '.md', '.yml', '.yaml'];
      if (!codeExts.includes(ext)) return { name, type: 'file', path: root, size: stat.size };
      return { name, type: 'file', path: root, size: stat.size };
    }
    const entries = fs.readdirSync(root);
    const children: DirEntry[] = [];
    for (const entry of entries) {
      if (IGNORED.has(entry)) continue;
      const full = path.join(root, entry);
      const child = scanProject(full, depth + 1);
      if (child) children.push(child);
    }
    return { name, type: 'dir', path: root, children };
  } catch { return null; }
}

export function formatTree(tree: DirEntry, prefix = ''): string {
  if (!tree) return '';
  if (tree.type === 'file') return `${prefix}📄 ${tree.name}\n`;
  let out = `${prefix}📁 ${tree.name}/\n`;
  if (tree.children) {
    for (let i = 0; i < tree.children.length; i++) {
      const isLast = i === tree.children.length - 1;
      const childPrefix = prefix + (isLast ? '  ' : '│ ');
      out += `${prefix}${isLast ? '└─' : '├─'}${formatTree(tree.children[i], childPrefix)}`;
    }
  }
  return out;
}

export interface SearchResult {
  file: string;
  line: number;
  content: string;
}

export function searchCode(root: string, pattern: string, include?: string[]): SearchResult[] {
  const results: SearchResult[] = [];
  const fs = require('fs');
  const path = require('path');

  function walk(dir: string) {
    let entries: string[];
    try { entries = fs.readdirSync(dir); } catch { return; }
    for (const entry of entries) {
      if (IGNORED.has(entry)) continue;
      const full = path.join(dir, entry);
      let stat: any;
      try { stat = fs.statSync(full); } catch { continue; }
      if (stat.isDirectory()) walk(full);
      else if (stat.isFile()) {
        const ext = path.extname(full);
        if (include && !include.some((i) => ext === i || full.endsWith(i))) continue;
        try {
          const content = fs.readFileSync(full, 'utf-8');
          const lines = content.split('\n');
          const regex = new RegExp(pattern, 'i');
          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              results.push({ file: full, line: i + 1, content: lines[i].trim() });
            }
          }
        } catch {}
      }
    }
  }

  walk(root);
  return results;
}

export function readFileLines(filePath: string, startLine = 1, endLine?: number): string | null {
  try {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const end = endLine || lines.length;
    return lines.slice(startLine - 1, end).join('\n');
  } catch { return null; }
}

export interface FileEdit {
  file: string;
  oldString: string;
  newString: string;
}

export function applyEdit(edit: FileEdit): { ok: boolean; error?: string } {
  try {
    const fs = require('fs');
    let content = fs.readFileSync(edit.file, 'utf-8');
    if (!content.includes(edit.oldString)) {
      return { ok: false, error: `Could not find match in ${edit.file}` };
    }
    content = content.replace(edit.oldString, edit.newString);
    fs.writeFileSync(edit.file, content, 'utf-8');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export function listFiles(root: string, depth = 0): string[] {
  const files: string[] = [];
  const fs = require('fs');
  const path = require('path');
  let entries: string[];
  try { entries = fs.readdirSync(root); } catch { return files; }
  for (const entry of entries) {
    if (IGNORED.has(entry)) continue;
    const full = path.join(root, entry);
    let stat: any;
    try { stat = fs.statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      if (depth < 2) files.push(...listFiles(full, depth + 1));
      else files.push(full + '/');
    } else files.push(full);
  }
  return files;
}
