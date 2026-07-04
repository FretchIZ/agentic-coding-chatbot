import type { ToolDefinition, CodeExecutionResult } from '@learning-platform/shared';
import { logger } from '@learning-platform/shared';

export interface Tool {
  definition: ToolDefinition;
  execute(args: Record<string, unknown>): Promise<unknown>;
}

export class CodeExecutorTool implements Tool {
  definition: ToolDefinition = {
    type: 'function',
    function: {
      name: 'execute_code',
      description: 'Execute code in a sandboxed environment',
      parameters: {
        type: 'object',
        properties: {
          language: { type: 'string', enum: ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust', 'ruby'] },
          code: { type: 'string', description: 'Code to execute' },
          timeout: { type: 'number', description: 'Execution timeout in ms' },
        },
        required: ['language', 'code'],
      },
    },
  };

  async execute(args: Record<string, unknown>): Promise<CodeExecutionResult> {
    const { language, code, timeout = 5000 } = args as any;
    try {
      const response = await fetch(`${process.env.CODE_EXECUTOR_URL || 'http://localhost:8001'}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, timeout }),
      });
      return await response.json();
    } catch (error) {
      logger.error('Code execution failed', error as Error, { language });
      return { success: false, output: '', error: 'Execution service unavailable', executionTimeMs: 0, memoryUsedMb: 0, exitCode: 1 };
    }
  }
}

export class FileReaderTool implements Tool {
  definition: ToolDefinition = {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read contents of a file',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          maxSize: { type: 'number', description: 'Max content size in bytes' },
        },
        required: ['path'],
      },
    },
  };

  async execute(args: Record<string, unknown>): Promise<string> {
    const { path, maxSize = 100000 } = args as any;
    if (!path || typeof path !== 'string') throw new Error('Path is required');
    try {
      const response = await fetch(`${process.env.FILE_SERVICE_URL || 'http://localhost:8002'}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, maxSize }),
      });
      const data = await response.json();
      return data.content;
    } catch (error) {
      logger.error('File read failed', error as Error, { path });
      return `Error reading file: ${path}`;
    }
  }
}

export class WebSearchTool implements Tool {
  definition: ToolDefinition = {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for information',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          maxResults: { type: 'number', description: 'Maximum results' },
        },
        required: ['query'],
      },
    },
  };

  async execute(args: Record<string, unknown>): Promise<string> {
    const { query, maxResults = 5 } = args as any;
    try {
      const response = await fetch(`${process.env.SEARCH_SERVICE_URL || 'http://localhost:8003'}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxResults }),
      });
      const data = await response.json();
      return JSON.stringify(data.results);
    } catch (error) {
      logger.error('Web search failed', error as Error, { query });
      return 'Search service unavailable';
    }
  }
}

export class CalculatorTool implements Tool {
  definition: ToolDefinition = {
    type: 'function',
    function: {
      name: 'calculator',
      description: 'Perform mathematical calculations',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'Math expression to evaluate' },
        },
        required: ['expression'],
      },
    },
  };

  async execute(args: Record<string, unknown>): Promise<number> {
    const { expression } = args as any;
    try {
      const fn = new Function(`"use strict"; return (${expression})`);
      const result = fn();
      if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid calculation');
      return result;
    } catch {
      throw new Error(`Invalid expression: ${expression}`);
    }
  }
}

export class SearchCodeTool implements Tool {
  definition: ToolDefinition = {
    type: 'function',
    function: {
      name: 'search_code',
      description: 'Search through codebase',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          pattern: { type: 'string', description: 'File pattern to search in' },
        },
        required: ['query'],
      },
    },
  };

  async execute(args: Record<string, unknown>): Promise<string> {
    const { query, pattern = '**/*' } = args as any;
    return JSON.stringify({ query, pattern, results: [] });
  }
}

export function createDefaultTools(): Tool[] {
  return [
    new CodeExecutorTool(),
    new FileReaderTool(),
    new WebSearchTool(),
    new CalculatorTool(),
    new SearchCodeTool(),
  ];
}

export { ToolRegistry } from './registry';