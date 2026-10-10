const DenseStringRegExp = /^[^\s\x85\u180e\u200b-\u200d\u2060]+$/;
const TrailingOWSRegExp = /[ \t]+$/;

const isOWS = (char: string | undefined) => char === " " || char === "\t";

/** qdtext = HTAB / SP / %x21 / %x23-5B / %x5D-7E / obs-text */
const isQdText = (code: number) =>
	code === 0x09 ||
	code === 0x20 ||
	code === 0x21 ||
	(0x23 <= code && code <= 0x5b) ||
	(0x5d <= code && code <= 0x7e) ||
	(0x80 <= code && code <= 0xff);

/** quoted-pair = "\" ( HTAB / SP / VCHAR / obs-text ) */
const isQuotedPairText = (code: number) =>
	code === 0x09 ||
	(0x20 <= code && code <= 0x7e) ||
	(0x80 <= code && code <= 0xff);

export interface ParsedNegotiationItem {
	value: string;
	parameters: Record<string, string>;
}
/**
 * Parses `text/html;charset=utf-8;foo=1` and returns
 * `{value: 'text/html', parameters: {charset: 'utf-8', foo: '1'}}`
 * https://tools.ietf.org/html/rfc7231#section-3.1.1.1
 * ```abnf
 * media-type = type "/" subtype *( OWS ";" OWS parameter )
 * type       = token
 * subtype    = token
 * parameter      = token "=" ( token / quoted-string )
 * ```
 * Quoted-string values are decoded (https://tools.ietf.org/html/rfc7230#section-3.2.6).
 */
export const parseNegotiationItem = (input: string): ParsedNegotiationItem => {
	const semiColonIndex = input.indexOf(";");
	const index = semiColonIndex < 0 ? input.length : semiColonIndex;
	// OWS is allowed before ";" (RFC 7231 §5.3.2)
	const value = input.slice(0, index).replace(TrailingOWSRegExp, "");
	if (!DenseStringRegExp.test(value)) {
		throw new Error("InvalidValue");
	}
	const parameters: Record<string, string> = {};
	const { length } = input;
	let pos = index;
	while (pos < length) {
		// input[pos] is ";" here
		pos += 1;
		while (isOWS(input[pos])) {
			pos += 1;
		}
		const attributeStart = pos;
		while (pos < length && input[pos] !== "=" && input[pos] !== ";") {
			pos += 1;
		}
		if (input[pos] !== "=") {
			throw new Error("InvalidNegotiationParameter");
		}
		const attribute = input.slice(attributeStart, pos).toLowerCase();
		if (!DenseStringRegExp.test(attribute)) {
			throw new Error("InvalidAttribute");
		}
		pos += 1;
		let attributeValue = "";
		if (input[pos] === '"') {
			pos += 1;
			while (true) {
				if (length <= pos) {
					throw new Error("InvalidQuote");
				}
				const char = input[pos];
				if (char === '"') {
					pos += 1;
					break;
				}
				if (char === "\\") {
					pos += 1;
					if (length <= pos || !isQuotedPairText(input.charCodeAt(pos))) {
						throw new Error("InvalidQuote");
					}
				} else if (!isQdText(input.charCodeAt(pos))) {
					throw new Error("InvalidAttributeValue");
				}
				attributeValue += input[pos];
				pos += 1;
			}
			while (isOWS(input[pos])) {
				pos += 1;
			}
			if (pos < length && input[pos] !== ";") {
				throw new Error("InvalidQuote");
			}
		} else {
			const valueStart = pos;
			while (pos < length && input[pos] !== ";") {
				pos += 1;
			}
			attributeValue = input
				.slice(valueStart, pos)
				.replace(TrailingOWSRegExp, "");
			if (!DenseStringRegExp.test(attributeValue)) {
				throw new Error("InvalidAttributeValue");
			}
		}
		parameters[attribute] = attributeValue;
	}
	return { value, parameters };
};
