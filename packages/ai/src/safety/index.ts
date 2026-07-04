import { logger } from '@learning-platform/shared';

export interface SafetyCheckResult {
  passed: boolean;
  flags: SafetyFlag[];
  score: number;
}

export interface SafetyFlag {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: string;
}

const BLOCKED_PATTERNS = [
  { pattern: /(?:hack|crack|exploit|vulnerability)\s*(?:tutorial|guide|how[\s-]to)/i, severity: 'critical' as const, category: 'security' },
  { pattern: /(?:harass|bully|threaten|stalk|dox)/i, severity: 'high' as const, category: 'harassment' },
  { pattern: /(?:suicide|self[\s-]harm|self[\s-]injury)/i, severity: 'critical' as const, category: 'self_harm' },
  { pattern: /(?:child\s*(?:porn|abuse|exploit)|CP)|grooming/i, severity: 'critical' as const, category: 'child_safety' },
  { pattern: /(?:illegal|unlawful|criminal)\s*(?:drug|substance|activity)/i, severity: 'high' as const, category: 'illegal' },
  { pattern: /(?:racial|ethnic|religious)\s*(?:slur|insult|attack)/i, severity: 'high' as const, category: 'hate_speech' },
];

const SENSITIVE_PATTERNS = [
  { pattern: /\b(?:\d{3}-\d{2}-\d{4})\b/, category: 'ssn' },
  { pattern: /\b(?:\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/, category: 'credit_card' },
  { pattern: /\b(?:password|secret|api[\s_-]?key|private[\s_-]?key)\s*[:=]\s*['"]?\S+['"]?/i, category: 'credentials' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, category: 'email' },
];

export class ContentModerator {
  check(text: string): SafetyCheckResult {
    const flags: SafetyFlag[] = [];
    for (const { pattern, severity, category } of BLOCKED_PATTERNS) {
      if (pattern.test(text)) {
        flags.push({ category, severity, message: `Blocked content detected: ${category}` });
      }
    }
    for (const { pattern, category } of SENSITIVE_PATTERNS) {
      if (pattern.test(text)) {
        flags.push({ category, severity: 'medium', message: `Sensitive data detected: ${category}` });
      }
    }
    const score = Math.max(0, 1 - flags.length * 0.2);
    return { passed: flags.length === 0, flags, score };
  }

  sanitize(text: string): string {
    let sanitized = text;
    for (const { pattern } of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
  }
}

export class InputValidator {
  validate(input: string): SafetyCheckResult {
    const flags: SafetyFlag[] = [];
    if (input.length > 10000) {
      flags.push({ category: 'length', severity: 'low', message: 'Input exceeds recommended length' });
    }
    if (input.length === 0) {
      flags.push({ category: 'empty', severity: 'medium', message: 'Input is empty' });
    }
    if (/[\uff00-\uffef]/.test(input)) {
      flags.push({ category: 'unicode', severity: 'low', message: 'Full-width characters detected' });
    }
    return { passed: flags.length === 0, flags, score: flags.length === 0 ? 1 : 0.5 };
  }
}

export class OutputValidator {
  validate(output: string): SafetyCheckResult {
    return new ContentModerator().check(output);
  }
}

export class SafetyManager {
  private moderator = new ContentModerator();
  private inputValidator = new InputValidator();
  private outputValidator = new OutputValidator();
  private readonly maxRetries = 3;

  async checkInput(input: string): Promise<SafetyCheckResult> {
    const inputCheck = this.inputValidator.validate(input);
    if (!inputCheck.passed) return inputCheck;
    const moderationCheck = this.moderator.check(input);
    if (!moderationCheck.passed) {
      logger.warn('Input failed safety check', { flags: moderationCheck.flags });
    }
    return moderationCheck;
  }

  async checkOutput(output: string): Promise<SafetyCheckResult> {
    const sanitized = this.moderator.sanitize(output);
    const check = this.outputValidator.validate(sanitized);
    if (!check.passed) {
      logger.warn('Output failed safety check', { flags: check.flags });
    }
    return check;
  }

  sanitizeOutput(output: string): string {
    return this.moderator.sanitize(output);
  }
}