# Image Downloader — agent guide
## Commands

```sh
bun install
bun start        # build once, then watch and rebuild
bun run build    # one-off build into build/
bun test         # or --watch
bun check        # type-check
bun run lint     # prettier --write .
```

The extension loads from `build/`, never `src/` — a change in `src/` does nothing until it is rebuilt and reloaded at chrome://extensions.

## No bundler
The build copies `src/**` (minus CSS, `src/Web/**`, `.ts`) into `build/`, runs Tailwind, and rewrites bare imports to `/lib/*.mjs`. Source stays as-is on disk: plain JS with `htm`/Preact, no JSX, types via JSDoc `// @ts-check` and `src/types.d.ts`; `.ts` files are only tests and types.

A runtime dependency costs edits in two places, not an install: its ESM file in the `libs` array in `scripts/build.ts`, and its bare specifier in the `importmap` in `scripts/config.ts`.

`manifest.json`'s `version` and `icons` are generated on build from `package.json` and `images/logo.svg` — bump the version in `package.json`, not the manifest.

## Tests
`bun test`, with happy-dom and the chrome stubs in `src/test-helpers.ts`. Tests sit next to the code as `*.test.ts`. While iterating, run only the file you touched; run the full suite once at the end.

## TDD
Use for features and bug fixes; skip for visual/CSS/copy changes and build tooling.

1. Write ONE failing test
2. Run it — it MUST fail
3. STOP; show me and let me refine it
4. Minimum code to pass
5. Run it — it MUST pass
6. STOP; wait for my next instruction

## Moving files
`git mv`, so history follows.
