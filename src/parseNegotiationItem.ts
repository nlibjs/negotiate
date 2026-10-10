import { parseNegotiationItemEntries } from "./parseNegotiationItemEntries.private.ts";

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
	const { value, entries } = parseNegotiationItemEntries(input);
	return { value, parameters: Object.fromEntries(entries) };
};
