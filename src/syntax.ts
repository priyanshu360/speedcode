export const SyntaxColor = {
  PLAIN: '\x1b[37m',
  KEYWORD: '\x1b[94m',
  STRING: '\x1b[32m',
  NUMBER: '\x1b[33m',
  TYPE: '\x1b[36m',
  BUILTIN: '\x1b[95m',
  RESET: '\x1b[0m',
} as const;

const TYPE_KW = new Set([
  'string',
  'number',
  'boolean',
  'symbol',
  'bigint',
  'void',
  'never',
  'any',
  'unknown',
  'null',
  'undefined',
  'object',
]);

const KEYWORDS = new Set([
  'let',
  'const',
  'var',
  'function',
  'class',
  'interface',
  'type',
  'extends',
  'implements',
  'return',
  'if',
  'else',
  'for',
  'while',
  'do',
  'switch',
  'case',
  'break',
  'continue',
  'import',
  'export',
  'from',
  'as',
  'async',
  'await',
  'of',
  'in',
  'new',
  'this',
  'super',
  'true',
  'false',
  'enum',
  'declare',
  'abstract',
  'readonly',
  'static',
  'public',
  'private',
  'protected',
  'throw',
  'try',
  'catch',
  'finally',
  'yield',
  'default',
  'typeof',
  'keyof',
  'infer',
  'satisfies',
  'using',
]);

const BUILTINS = new Set([
  'Error',
  'Promise',
  'Array',
  'Map',
  'Set',
  'Record',
  'Partial',
  'Required',
  'Readonly',
  'Pick',
  'Omit',
  'Exclude',
  'Extract',
  'NonNullable',
  'ReturnType',
  'Parameters',
  'Console',
  'JSON',
  'Math',
]);

const TOKEN_RE = /(`[^`\\]*(?:\\.[^`\\]*)*`|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')|(\b0[xX][0-9a-fA-F]+\b|\b\d+\.?\d*\b)|([a-zA-Z_$][a-zA-Z0-9_$]*)/g;

export function computeSyntaxColors(code: string): string[] {
  const colors = new Array<string>(code.length).fill(SyntaxColor.PLAIN);
  let match: RegExpExecArray | null;

  while ((match = TOKEN_RE.exec(code)) !== null) {
    const [full, str, num, word] = match;
    const start = match.index;
    const end = start + full.length;
    let color: string;

    if (str) color = SyntaxColor.STRING;
    else if (num) color = SyntaxColor.NUMBER;
    else if (word) color = KEYWORDS.has(word) ? SyntaxColor.KEYWORD
      : TYPE_KW.has(word) ? SyntaxColor.TYPE
        : BUILTINS.has(word) ? SyntaxColor.BUILTIN
          : SyntaxColor.PLAIN;
    else continue;

    colors.fill(color, start, end);
  }

  return colors;
}
