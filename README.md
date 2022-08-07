# @nlib/negotiate

[![.github/workflows/test.yml](https://github.com/nlibjs/negotiate/actions/workflows/test.yml/badge.svg)](https://github.com/nlibjs/negotiate/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/nlibjs/negotiate/branch/master/graph/badge.svg)](https://codecov.io/gh/nlibjs/negotiate)

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
const generator = parseAcceptStatements('v1,v2;q=0.9,v3;q=0.8')
generator.next().value; // → {value: 'v1', q: 1}
generator.next().value; // → {value: 'v2', q: 0.9}
generator.next().value; // → {value: 'v3', q: 0.8}
generator.next(); // → {value: undefined, done: true}
```

## parseNegotiationItem

```typescript
parseNegotiationItem('text/html;charset=utf-8;foo=1')
// → {value: 'text/html', parameters: {charset: 'utf-8', foo: '1'}}
```
