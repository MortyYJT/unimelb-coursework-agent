interface Token { text: string; offset: number; literal?: boolean }

function decode(text: string): string {
  return text.replace(/\\(u\{[\da-fA-F]+\}|u[\da-fA-F]{4}|x[\da-fA-F]{2}|\r?\n|.)/gs, (_, escape: string) => {
    if (escape.startsWith('u{')) return String.fromCodePoint(parseInt(escape.slice(2, -1), 16));
    if (/^[ux][\da-fA-F]+$/.test(escape)) return String.fromCharCode(parseInt(escape.slice(1), 16));
    return ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '0': '\0', '\n': '', '\r\n': '' } as Record<string, string>)[escape] ?? escape;
  });
}

/** Skip comments/literal text while scanning executable template interpolations recursively. */
export function sqliteImports(source: string): number[] {
  const tokens: Token[] = [];
  let position = 0;
  function quoted(quote: string): Token {
    const offset = position++;
    const start = position;
    while (position < source.length && source[position] !== quote) {
      position += source[position] === '\\' ? 2 : 1;
    }
    const text = decode(source.slice(start, position));
    position++;
    return { text, offset, literal: true };
  }
  function template(): void {
    const offset = position++;
    const start = position;
    let interpolated = false;
    while (position < source.length && source[position] !== '`') {
      if (source[position] === '\\') { position += 2; continue; }
      if (source.slice(position, position + 2) === '${') {
        interpolated = true;
        position += 2;
        tokens.push({ text: '{', offset: position - 1 });
        scan(true);
        tokens.push({ text: '}', offset: position - 1 });
      } else position++;
    }
    if (!interpolated) tokens.push({ text: decode(source.slice(start, position)), offset, literal: true });
    position++;
  }
  function regexAllowed(): boolean {
    const previous = tokens.at(-1);
    if (!previous) return true;
    if (previous.literal) return false;
    if (['=', '(', '[', '{', ',', ';', ':', '?', '!', '&', '|', '+', '-', '*', '%', '>',
      'return', 'throw', 'yield', 'await', 'case', 'delete', 'void', 'typeof', 'in', 'of'].includes(previous.text)) return true;
    // A closing control-flow condition permits a regex expression statement.
    if (previous.text === ')') {
      let depth = 0;
      for (let index = tokens.length - 1; index >= 0; index--) {
        if (tokens[index].literal) continue;
        if (tokens[index].text === ')') depth++;
        if (tokens[index].text === '(' && --depth === 0) {
          return ['if', 'while', 'for', 'with', 'switch', 'catch'].includes(tokens[index - 1]?.text);
        }
      }
    }
    return false;
  }
  function regex(): void {
    const offset = position++;
    let inClass = false;
    while (position < source.length) {
      const char = source[position++];
      if (char === '\\') { position++; continue; }
      if (char === '[') inClass = true;
      if (char === ']') inClass = false;
      if (char === '/' && !inClass) break;
    }
    while (/[A-Za-z]/.test(source[position] ?? '')) position++;
    tokens.push({ text: source.slice(offset, position), offset, literal: true });
  }
  function scan(interpolation = false): void {
    let braces = 0;
    while (position < source.length) {
      const char = source[position];
      if (/\s/.test(char)) { position++; continue; }
      if (source.slice(position, position + 2) === '//') {
        const end = source.indexOf('\n', position + 2);
        position = end < 0 ? source.length : end;
        continue;
      }
      if (source.slice(position, position + 2) === '/*') {
        const end = source.indexOf('*/', position + 2);
        position = end < 0 ? source.length : end + 2;
        continue;
      }
      if (char === '/' && regexAllowed()) { regex(); continue; }
      if (char === "'" || char === '"') { tokens.push(quoted(char)); continue; }
      if (char === '`') { template(); continue; }
      if (char === '{') braces++;
      if (char === '}') {
        if (interpolation && braces === 0) { position++; return; }
        braces--;
      }
      const identifier = /^[A-Za-z_$][\w$]*/.exec(source.slice(position));
      const text = identifier?.[0] ?? char;
      tokens.push({ text, offset: position });
      position += text.length;
    }
  }
  scan();
  const lines = new Set<number>();
  tokens.forEach((token, index) => {
    if (!token.literal || token.text !== 'node:sqlite') return;
    const previous = tokens[index - 1];
    const callee = tokens[index - 2];
    if ((!previous?.literal && (previous?.text === 'from' || previous?.text === 'import'))
      || (previous?.text === '(' && !callee?.literal && (callee?.text === 'import' || callee?.text === 'require'))) {
      lines.add(source.slice(0, token.offset).split('\n').length);
    }
  });
  return [...lines].sort((a, b) => a - b);
}
