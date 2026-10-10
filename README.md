# @nlib/negotiate

[![.github/workflows/test.yml](https://github.com/nlibjs/negotiate/actions/workflows/test.yml/badge.svg)](https://github.com/nlibjs/negotiate/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/nlibjs/negotiate/graph/badge.svg?token=uSsvlnhMEO)](https://codecov.io/gh/nlibjs/negotiate)

**RFC-compliant HTTP content negotiation, made simple with TypeScript.**

`@nlib/negotiate` parses `Accept`, `Accept-Language`, `Accept-Encoding`, and other HTTP request headers to help your server select the best response format for each client.

- **RFC 7231 compliant** — faithful implementation of [Section 5.3 of RFC 7231]
- **Wildcard support** — handles `*`, `type/*`, `*/subtype`, and `*/*` patterns
- **Extensible** — plug in a custom matcher function to control how values are compared
- **Fault-tolerant** — `loose` mode silently skips malformed header values to gracefully handle real-world client quirks
- **Specificity-aware** — each value gets the quality of its most specific matching range, and `q=0` excludes it
- **Dual package** — ships both ESM and CJS builds, ready for any modern JS environment

Utilities for content negotiation described in [Section 5.3 of RFC 7231].

[Section 5.3 of RFC 7231]: https://www.rfc-editor.org/rfc/rfc7231.html#section-5.3

## negotiate

```typescript
const supported = ['text/html', 'image/webp'];
const accept = 'text/html,image/avif,image/webp,image/apng,*/*;q=0.8';
negotiate(supported, accept); // → 'text/html'
negotiate([], accept); // → null
```

Values are compared case-insensitively. The default matcher treats `*` as a
wildcard, which fits `Accept`, `Accept-Encoding` and `Accept-Charset`. For
`Accept-Language`, pass `languageMatcher` so that a range such as `en` selects
`en-US`.

## languageMatcher

Implements Basic Filtering of [RFC 4647 §3.3.1]: a range matches a tag if it
equals the tag or is a prefix followed by `-`, case-insensitively.

```typescript
negotiate(['en-US', 'ja'], 'en;q=0.8, ja;q=0.5', languageMatcher); // → 'en-US'
negotiate(['eng'], 'en', languageMatcher); // → null
```

[RFC 4647 §3.3.1]: https://www.rfc-editor.org/rfc/rfc4647.html#section-3.3.1

## parseAcceptStatements

```typescript
const generator = parseAcceptStatements('v1,v2;q=0.9,v3;q=0.8');
generator.next().value; // → {value: 'v1', q: 1, parameters: {}}
generator.next().value; // → {value: 'v2', q: 0.9, parameters: {}}
generator.next().value; // → {value: 'v3', q: 0.8, parameters: {}}
generator.next(); // → {value: undefined, done: true}
```

## parseNegotiationItem

```typescript
parseNegotiationItem('text/html;charset=utf-8;foo=1');
// → {value: 'text/html', parameters: {charset: 'utf-8', foo: '1'}}
```
