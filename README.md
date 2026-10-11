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

The default matcher compares media types, codings, language tags and parameter
names case-insensitively. Parameter values are compared exactly, except
`charset`, which is case-insensitive. The default matcher treats `*` as a
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

## Publishing to JSR

The JSR package name is [`@nlib/negotiate`](https://jsr.io/@nlib/negotiate).
Its entry point is `src/mod.ts`. JSR receives the TypeScript sources, including
internal modules needed by the public API, plus the license, README and changelog.
Tests and the npm build outputs are excluded. No runtime dependencies or npm build
are needed for JSR publishing.

The setup follows [nlibjs/typing](https://github.com/nlibjs/typing): publishing a
GitHub Release runs `.github/workflows/release.yml`, with separate npm and JSR jobs.
The JSR job installs the existing development dependencies for entry-point
generation, uses Deno 2 directly, verifies the release metadata and generated entry
point, and runs a dry-run before publishing. It authenticates with GitHub Actions
OIDC using `contents: read` and `id-token: write`; no JSR token or secret is needed.
Pull requests and pushes to `main` run the same publication checks in `TestPublish`,
with read-only permissions and no actual publication.

To validate locally without publishing, install Deno 2 and run:

```sh
npm ci
npm run check:release
npm run build:index
git diff --exit-code -- src/mod.ts
deno publish --dry-run
```

For a dry-run of uncommitted changes, add `--allow-dirty` to that command.
The release workflow requires a clean checkout and does not use this option.

To release, first merge the changes and choose the appropriate version bump
(for example, `npm version minor`). The existing version lifecycle synchronizes
`jsr.json` with `package.json` and stages it in the version commit. Push that commit
and its `vX.Y.Z` tag, then publish a GitHub Release for that tag. The JSR job checks
that the tag, `package.json` and `jsr.json` versions match. Publishing the release
also runs the existing npm publication job; there is no manual JSR-only trigger.
Versions are immutable on JSR, so use a new version for changed package contents.

By default, JSR also requires the GitHub Actions user who triggers publishing to
be a member of the `nlib` scope. Publish the release from a scope member's account.
If releases or workflow reruns are triggered by a bot or another non-member,
review the scope's CI publishing policy in JSR and disable the scope-member
requirement only if that automation should be allowed. Repository linking and
OIDC alone do not override that policy. Releases created with GitHub's
`GITHUB_TOKEN` do not trigger another release workflow; automated release creation
must use a GitHub App or other credential that permits triggering workflows.
