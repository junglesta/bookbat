---
"@bookbat/baobab": minor
"@bookbat/library-core": minor
---

Initial public release of the BAOBAB display component as a standalone package.

- `@bookbat/baobab` — `BookBatClient.astro` extracted from the demo app, decoupled
  from the sibling editor app, with an `exports` map (`.` and `./BookBatClient.astro`),
  `astro` as a peer dependency, and an optional `bookbatVersion` prop.
- `@bookbat/library-core` — now published (types + `parseLibraryPayload`) so the
  component is consumable by third-party Astro sites.
