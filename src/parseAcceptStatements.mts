import { parseNegotiationItem } from './parseNegotiationItem.mjs';

// eslint-disable-next-line @nlib/no-globals
const { Error, Number } = globalThis;

export interface ParseAcceptResult<Type extends string> {
  value: Type;
  q: number;
  // parameters: Record<string, string>,
}

/**
 * https://www.rfc-editor.org/rfc/rfc7231.html#section-5.3
 * Parses an "Accept-*" value and yield `{value, q}`.
 * @example
 * ```javascript
 * const generator = parseAcceptStatements('v1,v2;q=0.9,v3;q=0.8')
 * generator.next().value; // → {value: 'v1', q: 1}
 * generator.next().value; // → {value: 'v2', q: 0.9}
 * generator.next().value; // → {value: 'v3', q: 0.8}
 * generator.next(); // → {value: undefined, done: true}
 * ```
 */
export const parseAcceptStatements = function* (
  acceptStatements: string,
  loose = false,
): Generator<ParseAcceptResult<string>> {
  for (const statement of acceptStatements.split(',')) {
    try {
      const { value, parameters } = parseNegotiationItem(statement);
      const q = Number.parseFloat(parameters.q || '1');
      if (0 <= q && q <= 1) {
        yield { value, q };
      } else {
        throw new Error(`InvalidQuality: ${value}`);
      }
    } catch (error: unknown) {
      if (!loose) {
        throw error;
      }
    }
  }
};
