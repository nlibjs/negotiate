# @nlib/negotiate

[![.github/workflows/test.yml](https://github.com/nlibjs/negotiate/actions/workflows/test.yml/badge.svg)](https://github.com/nlibjs/negotiate/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/nlibjs/negotiate/graph/badge.svg?token=uSsvlnhMEO)](https://codecov.io/gh/nlibjs/negotiate)

**RFC 7231 準拠の HTTP コンテントネゴシエーションを、TypeScript でシンプルに。**

`@nlib/negotiate` は、HTTP の `Accept` / `Accept-Language` / `Accept-Encoding` といったヘッダーを解析し、サーバーがクライアントに最適なレスポンス形式を選択するためのユーティリティライブラリです。

- **RFC 準拠** — [Section 5.3 of RFC 7231] で定義された仕様に忠実に実装
- **ワイルドカード対応** — `*`, `type/*`, `*/subtype`, `*/*` の 4 パターンに対応
- **拡張可能** — カスタムマッチャー関数でマッチングロジックを自由に差し替え可能
- **寛容な解析** — `loose` モードで不正なヘッダー値をスキップし、実環境のリクエストに柔軟に対応
- **高効率** — 品質値 1.0 のマッチが見つかり次第、早期リターンで処理を打ち切る最適化済み
- **デュアルパッケージ** — ESM / CJS 両対応でモダンな JS エコシステムにそのまま組み込み可能

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
