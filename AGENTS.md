## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used.

### Available skills
- build-deployment: Build scripts, deployment config, and troubleshooting for this Svelte 5 + Vite static client app (file: /Users/admi/Sites/books-freedom/.agents/skills/build-deployment/SKILL.md)
- css-conventions: CSS naming and style rules for this Svelte/Vite client app (file: /Users/admi/Sites/books-freedom/.agents/skills/css-conventions/SKILL.md)
- library-data-flow: Rules for editing library book data — `data/library.json` is the only hand-edited file; the two per-app copies are auto-overwritten by `pnpm data:sync`. Read before any paste or build that touches library data. (file: /Users/admi/Sites/books-freedom/.agents/skills/library-data-flow/SKILL.md)
- package-json: Required package.json fields, scripts, and version bumping rules for this Vite/Svelte app (file: /Users/admi/Sites/books-freedom/.agents/skills/package-json/SKILL.md)
- preflight: Pre-deploy checklist for this static client app: format, lint, test, build, optional preview, version bump, changelog. Stops before commit. (file: /Users/admi/Sites/books-freedom/.agents/skills/preflight/SKILL.md)
- pwa: PWA setup for this Vite/Svelte app — manifest, service worker, icons, and index.html tags (file: /Users/admi/Sites/books-freedom/.agents/skills/pwa/SKILL.md)
- skill-dir-structure: Reference for local skill directory layout, format, and discovery behavior. (file: /Users/admi/Sites/books-freedom/.agents/skills/skill-dir-structure.md)
- typescript-patterns: TypeScript conventions and Biome rules for this Svelte 5 + Vite app (file: /Users/admi/Sites/books-freedom/.agents/skills/typescript-patterns/SKILL.md)
- version-in-footer: Show package.json version in a Svelte footer component (file: /Users/admi/Sites/books-freedom/.agents/skills/version-in-footer/SKILL.md)
- version-in-metatitle: Show package.json version in browser title or metadata for this Svelte app (file: /Users/admi/Sites/books-freedom/.agents/skills/version-in-metatitle/SKILL.md)

### How to use skills
- Discovery: The list above is the skills available in this session (name + description + file path). Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, use that skill for that turn.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
