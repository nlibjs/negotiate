import { parseNegotiationItem } from "./parseNegotiationItem.ts";

/**
 * https://www.rfc-editor.org/rfc/rfc7231.html#section-5.3.1
 * qvalue = ( "0" [ "." 0*3DIGIT ] ) / ( "1" [ "." 0*3("0") ] )
 */
const QValueRegExp = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/;
const OWSRegExp = /^[ \t]+|[ \t]+$/g;

/**
 * Splits a header value at commas outside quoted-strings.
 */
const splitList = function* (input: string): Generator<string> {
	let start = 0;
	let quoted = false;
	for (let pos = 0; pos < input.length; pos++) {
		const char = input[pos];
		if (quoted) {
			if (char === "\\") {
				pos += 1;
			} else if (char === '"') {
				quoted = false;
			}
		} else if (char === '"') {
			quoted = true;
		} else if (char === ",") {
			yield input.slice(start, pos);
			start = pos + 1;
		}
	}
	yield input.slice(start);
};

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
	for (const element of splitList(acceptStatements)) {
		// OWS is allowed around list elements and empty elements are ignored
		// (RFC 7230 §7)
		const statement = element.replace(OWSRegExp, "");
		if (!statement) {
			continue;
		}
		try {
			const { value, parameters } = parseNegotiationItem(statement);
			const qvalue = parameters.q ?? "1";
			if (!QValueRegExp.test(qvalue)) {
				throw new Error(`InvalidQuality: ${value}`);
			}
			yield { value, q: Number(qvalue) };
		} catch (error: unknown) {
			if (!loose) {
				throw error;
			}
		}
	}
};
