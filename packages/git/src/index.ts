export interface GitFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
}

export interface GitCommit {
  hash: string;
  author: string;
  message: string;
  date: Date;
  branch: string;
}

export interface GitDiff {
  file: string;
  additions: number;
  deletions: number;
  patch: string;
}

export interface GitProvider {
  init(path: string): Promise<void>;
  status(): Promise<{ branch: string; files: GitFile[]; ahead: number; behind: number }>;
  add(files?: string[]): Promise<void>;
  commit(message: string): Promise<GitCommit>;
  push(remote?: string, branch?: string): Promise<void>;
  pull(remote?: string, branch?: string): Promise<void>;
  diff(file?: string): Promise<GitDiff[]>;
  log(maxCount?: number): Promise<GitCommit[]>;
  checkout(branch: string): Promise<void>;
  createBranch(name: string): Promise<void>;
  getFileContent(path: string, ref?: string): Promise<string | null>;
}

export class SimpleGitProvider implements GitProvider {
  private repoPath = '';

  async init(path: string): Promise<void> {
    this.repoPath = path;
  }

  private async run(args: string[]): Promise<string> {
    const { execSync } = require('child_process');
    return execSync(`git ${args.join(' ')}`, { cwd: this.repoPath, encoding: 'utf-8' });
  }

  async status(): Promise<{ branch: string; files: GitFile[]; ahead: number; behind: number }> {
    const branch = (await this.run(['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
    const statusOutput = (await this.run(['status', '--porcelain'])).trim();
    const files: GitFile[] = statusOutput
      ? statusOutput.split('\n').map((line: string) => {
          const status = line.substring(0, 2).trim();
          return { path: line.substring(3), status: this.parseStatus(status) };
        })
      : [];
    return { branch, files, ahead: 0, behind: 0 };
  }

  private parseStatus(code: string): GitFile['status'] {
    switch (code) {
      case 'M': return 'modified';
      case 'A': return 'added';
      case 'D': return 'deleted';
      case 'R': return 'renamed';
      default: return 'untracked';
    }
  }

  async add(files?: string[]): Promise<void> {
    await this.run(['add', files ? files.join(' ') : '.']);
  }

  async commit(message: string): Promise<GitCommit> {
    await this.run(['commit', '-m', `"${message.replace(/"/g, '\\"')}"`]);
    const log = await this.log(1);
    return log[0];
  }

  async push(remote = 'origin', branch?: string): Promise<void> {
    const currentBranch = branch || (await this.run(['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
    await this.run(['push', remote, currentBranch]);
  }

  async pull(remote = 'origin', branch?: string): Promise<void> {
    const currentBranch = branch || (await this.run(['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
    await this.run(['pull', remote, currentBranch]);
  }

  async diff(file?: string): Promise<GitDiff[]> {
    const args = ['diff', '--numstat'];
    if (file) args.push(file);
    const output = (await this.run(args)).trim();
    if (!output) return [];
    return output.split('\n').map((line: string) => {
      const [additions, deletions, filePath] = line.split('\t');
      return { file: filePath, additions: parseInt(additions), deletions: parseInt(deletions), patch: '' };
    });
  }

  async log(maxCount = 10): Promise<GitCommit[]> {
    const output = (await this.run(['log', `--max-count=${maxCount}`, '--format=%H|%an|%s|%ai|%d'])).trim();
    if (!output) return [];
    return output.split('\n').map((line: string) => {
      const [hash, author, message, date, refs] = line.split('|');
      return { hash, author, message, date: new Date(date), branch: refs || '' };
    });
  }

  async checkout(branch: string): Promise<void> {
    await this.run(['checkout', branch]);
  }

  async createBranch(name: string): Promise<void> {
    await this.run(['checkout', '-b', name]);
  }

  async getFileContent(path: string, ref = 'HEAD'): Promise<string | null> {
    try {
      return (await this.run(['show', `${ref}:${path}`])).trim();
    } catch {
      return null;
    }
  }
}
