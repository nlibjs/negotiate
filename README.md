# @nlib/negotiate

[![.github/workflows/test.yml](https://github.com/nlibjs/negotiate/actions/workflows/test.yml/badge.svg)](https://github.com/nlibjs/negotiate/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/nlibjs/negotiate/graph/badge.svg?token=uSsvlnhMEO)](https://codecov.io/gh/nlibjs/negotiate)

**RFC-compliant HTTP content negotiation, made simple with TypeScript.**

`@nlib/negotiate` parses `Accept`, `Accept-Language`, `Accept-Encoding`, and other HTTP request headers to help your server select the best response format for each client.

- **RFC 7231 compliant** — faithful implementation of [Section 5.3 of RFC 7231]
- **Wildcard support** — handles `*`, `type/*`, `*/subtype`, and `*/*` patterns
- **Extensible** — plug in a custom matcher function to override matching logic
- **Fault-tolerant** — `loose` mode silently skips malformed header values for real-world robustness
- **Efficient** — short-circuits as soon as a quality-1.0 match is found
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

## parseAcceptStatements

```typescript
const generator = parseAcceptStatements('v1,v2;q=0.9,v3;q=0.8');
generator.next().value; // → {value: 'v1', q: 1}
generator.next().value; // → {value: 'v2', q: 0.9}
generator.next().value; // → {value: 'v3', q: 0.8}
generator.next(); // → {value: undefined, done: true}
```

## parseNegotiationItem

```typescript
parseNegotiationItem('text/html;charset=utf-8;foo=1');
// → {value: 'text/html', parameters: {charset: 'utf-8', foo: '1'}}
```
