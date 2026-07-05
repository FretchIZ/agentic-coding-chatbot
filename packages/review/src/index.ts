export type ReviewSeverity = 'error' | 'warning' | 'info';
export type ReviewCategory = 'bug' | 'security' | 'performance' | 'style' | 'best_practice' | 'documentation';

export interface ReviewIssue {
  file: string;
  line: number;
  column?: number;
  severity: ReviewSeverity;
  category: ReviewCategory;
  message: string;
  suggestion?: string;
  code?: string;
}

export interface ReviewResult {
  issues: ReviewIssue[];
  score: number;
  summary: string;
  suggestions: string[];
}

export interface ReviewOptions {
  checkSecurity?: boolean;
  checkPerformance?: boolean;
  checkStyle?: boolean;
  checkBestPractices?: boolean;
  checkDocumentation?: boolean;
}

export interface CodeReviewEngine {
  review(files: Array<{ path: string; content: string }>, options?: ReviewOptions): Promise<ReviewResult>;
  getFixSuggestions(issue: ReviewIssue): Promise<string>;
}

export class BasicReviewEngine implements CodeReviewEngine {
  async review(files: Array<{ path: string; content: string }>, options?: ReviewOptions): Promise<ReviewResult> {
    const issues: ReviewIssue[] = [];
    for (const file of files) {
      const lines = file.content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('console.log')) {
          issues.push({
            file: file.path,
            line: i + 1,
            severity: 'warning',
            category: 'best_practice',
            message: 'Avoid using console.log in production code',
            suggestion: 'Use a proper logging library instead',
          });
        }
        if (line.includes('any') && !line.includes('// eslint-disable')) {
          issues.push({
            file: file.path,
            line: i + 1,
            severity: 'warning',
            category: 'style',
            message: 'Avoid using `any` type',
            suggestion: 'Use a more specific type or `unknown` if the type is truly unknown',
          });
        }
        if (line.includes('TODO') || line.includes('FIXME')) {
          issues.push({
            file: file.path,
            line: i + 1,
            severity: 'info',
            category: 'documentation',
            message: `Found TODO/FIXME comment: ${line.trim()}`,
          });
        }
      });
    }

    const score = Math.max(0, 100 - issues.reduce((acc, i) => {
      return acc + (i.severity === 'error' ? 10 : i.severity === 'warning' ? 5 : 1);
    }, 0));

    return {
      issues,
      score,
      summary: `Reviewed ${files.length} file(s). Found ${issues.length} issue(s). Score: ${score}/100`,
      suggestions: issues.filter((i) => i.suggestion).map((i) => i.suggestion!),
    };
  }

  async getFixSuggestions(issue: ReviewIssue): Promise<string> {
    return `Consider fixing: ${issue.message}\nSuggested: ${issue.suggestion || 'No specific suggestion available'}`;
  }
}
