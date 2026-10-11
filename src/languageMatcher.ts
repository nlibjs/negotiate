import type { NegotiateMatcher } from "./negotiate.ts";

/**
 * A matcher for `Accept-Language` implementing Basic Filtering of RFC 4647
 * (https://www.rfc-editor.org/rfc/rfc4647.html#section-3.3.1).
 * A language range matches a tag if it equals the tag or is a prefix of the
 * tag followed by "-", case-insensitively. `*` matches any tag.
 * @example
 * ```javascript
 * negotiate(['en-US', 'ja'], 'en;q=0.8,ja;q=0.5', languageMatcher); // → 'en-US'
 * ```
 */
export const languageMatcher = <Type extends string>(
	tags: ReadonlyArray<Type>,
	range: string,
): Type | null => {
	if (range === "*") {
		return tags.length > 0 ? tags[0] : null;
	}
	const normalizedRange = range.toLowerCase();
	for (const tag of tags) {
		const normalizedTag = tag.toLowerCase();
		if (
			normalizedTag === normalizedRange ||
			normalizedTag.startsWith(`${normalizedRange}-`)
		) {
			return tag;
		}
	}
	return null;
};

languageMatcher satisfies NegotiateMatcher<string>;
