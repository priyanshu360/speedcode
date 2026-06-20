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

function fill(arr: string[], from: number, to: number, val: string): void {
  for (let i = from; i < to && i < arr.length; i++) {
    arr[i] = val;
  }
}

export function computeSyntaxColors(code: string): string[] {
  const colors = new Array<string>(code.length).fill(SyntaxColor.PLAIN);

  let i = 0;
  while (i < code.length) {
    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== quote) {
        if (code[j] === '\\') j++;
        j++;
      }
      fill(colors, i, Math.min(j + 1, code.length), SyntaxColor.STRING);
      i = j + 1;
      continue;
    }

    if (code[i] === '`') {
      let j = i + 1;
      while (j < code.length && code[j] !== '`') {
        if (code[j] === '\\') j++;
        j++;
      }
      fill(colors, i, Math.min(j + 1, code.length), SyntaxColor.STRING);
      i = j + 1;
      continue;
    }

    if (/[0-9]/.test(code.charAt(i)) || (code[i] === '.' && /[0-9]/.test(code.charAt(i + 1)))) {
      let j = i;
      if (code[i] === '0' && (code[i + 1] === 'x' || code[i + 1] === 'X')) {
        j += 2;
        while (j < code.length && /[0-9a-fA-F]/.test(code.charAt(j))) j++;
      } else {
        while (j < code.length && /[0-9.]/.test(code.charAt(j))) j++;
      }
      fill(colors, i, j, SyntaxColor.NUMBER);
      i = j;
      continue;
    }

    if (/[a-zA-Z_$]/.test(code.charAt(i))) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code.charAt(j))) j++;
      const word = code.slice(i, j);
      if (TYPE_KW.has(word)) {
        fill(colors, i, j, SyntaxColor.TYPE);
      } else if (KEYWORDS.has(word)) {
        fill(colors, i, j, SyntaxColor.KEYWORD);
      } else if (BUILTINS.has(word)) {
        fill(colors, i, j, SyntaxColor.BUILTIN);
      }
      i = j;
      continue;
    }

    i++;
  }

  return colors;
}
