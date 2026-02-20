const DenseStringRegExp = /^[^\s\x85\u180e\u200b-\u200d\u2060]+$/;

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
 */
export const parseNegotiationItem = (input: string): ParsedNegotiationItem => {
	const semiColonIndex = input.indexOf(";");
	const index = semiColonIndex < 0 ? input.length : semiColonIndex;
	const value = input.slice(0, index);
	if (!DenseStringRegExp.test(value)) {
		throw new Error("InvalidValue");
	}
	const parameters: Record<string, string> = {};
	if (0 < semiColonIndex) {
		for (const parameter of (input.slice(semiColonIndex + 1) || " ").split(
			";",
		)) {
			const equalIndex = parameter.indexOf("=");
			if (equalIndex < 0) {
				throw new Error("InvalidNegotiationParameter");
			}
			const attribute = parameter
				.slice(0, equalIndex)
				.trimStart()
				.toLowerCase();
			if (!DenseStringRegExp.test(attribute)) {
				throw new Error("InvalidAttribute");
			}
			let attributeValue = parameter.slice(equalIndex + 1).trimEnd();
			if (attributeValue.startsWith('"')) {
				if (attributeValue.endsWith('"')) {
					attributeValue = attributeValue.slice(1, -1);
				} else {
					throw new Error("InvalidQuote");
				}
			}
			if (!DenseStringRegExp.test(attributeValue)) {
				throw new Error("InvalidAttributeValue");
			}
			parameters[attribute] = attributeValue;
		}
	}
	return { value, parameters };
};
