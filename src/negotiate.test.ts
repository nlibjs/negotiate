import {negotiate} from './negotiate';

test('return null if the statement is empty', () => {
    expect(negotiate(['v1'], '')).toBe(null);
    expect(negotiate(['v1'])).toBe(null);
    expect(negotiate(['v1'], null)).toBe(null);
});
test('return v1', () => {
    expect(negotiate(['v1'], 'v1')).toBe('v1');
});
test('return null if nothing matches', () => {
    expect(negotiate(['v2'], 'v1')).toBe(null);
});
test('return the highest', () => {
    expect(negotiate(['v1', 'v2'], 'v1;q=0.9,v2;q=1')).toBe('v2');
});
test('return the first of same q', () => {
    expect(negotiate(['v1', 'v2'], 'v1;q=0.9,v2;q=0.9')).toBe('v1');
});
const xMatcher = (list: ReadonlyArray<string>, value: string) => {
    if (value === 'x*') {
        for (const v of list) {
            if (v.startsWith('x')) {
                return v;
            }
        }
    } else if (list.includes(value)) {
        return value;
    }
    return null;
};
test('negotiate with matcher', () => {
    expect(
        negotiate(['v1', 'v2', 'x3'], 'v1;q=0.9,v2;q=0.9,x*;q=1', xMatcher),
    ).toBe('x3');
});
test('negotiate an accept header value', () => {
    expect(
        negotiate(
            ['text/html'],
            'text/html,image/avif,image/webp,image/apng,*/*;q=0.8',
        ),
    ).toBe('text/html');
});
test('negotiate an accept header value (highest)', () => {
    expect(
        negotiate(
            ['text/html', 'image/webp'],
            'text/html,image/avif,image/webp,image/apng,*/*;q=0.8',
        ),
    ).toBe('text/html');
});
