import {LATIN_CAPITAL_LETTER_A} from '@nlib/typing';
import {isDenseString} from './isDenseString.private';

/**
 * https://en.wikipedia.org/wiki/Whitespace_character#Unicode
 */
const spaceCodePoints = [
    0x0009, 0x000a, 0x000b, 0x000c, 0x000d, 0x0020, 0x0085, 0x00a0, 0x1680,
    0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008,
    0x2009, 0x200a, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000,
];
const nonSpaceCodePoints = [0x180e, 0x200b, 0x200c, 0x200d, 0x2060, 0xfeff];
for (const list of [spaceCodePoints, nonSpaceCodePoints]) {
    for (const spaceCodePoint of list) {
        const codePoints = [
            LATIN_CAPITAL_LETTER_A,
            spaceCodePoint,
            LATIN_CAPITAL_LETTER_A,
        ];
        const hex = codePoints.map((c) => c.toString(16).padStart(2, '0'));
        test(`${hex.join('-')} → false`, () => {
            const input = String.fromCodePoint(...codePoints);
            expect(isDenseString(input)).toBe(false);
        });
    }
}
test('reject empty string', () => {
    expect(isDenseString('')).toBe(false);
});
test('accept dense string', () => {
    expect(isDenseString('foo')).toBe(true);
});
test('accept sparse strings', () => {
    expect(isDenseString(' foo')).toBe(false);
    expect(isDenseString('foo ')).toBe(false);
    expect(isDenseString(' foo ')).toBe(false);
    expect(isDenseString('foo\n')).toBe(false);
    expect(isDenseString('\rfoo')).toBe(false);
    expect(isDenseString('foo\t')).toBe(false);
});
