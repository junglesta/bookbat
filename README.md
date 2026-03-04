[![Netlify Status](https://api.netlify.com/api/v1/badges/28542ff1-4d69-4518-abdc-5cb625f0befe/deploy-status)](https://app.netlify.com/projects/bookfreedom/deploys)


<a href="https://bat.junglestar.org">
  <img src="apps/webapp/src/assets/startscreen.svg" alt="BOOK BAT" width="480">
</a>


>  no account. no cloud. no tracking. | scan it. shelve it. own your data.

## WHY

because your reading list shouldn't live on some corpo platform that sells your habits, goes down randomly, or gets acqui-hired into oblivion.

your books, your list, your rules.

## HOW

- scan ISBN barcodes with your camera or type them in
- auto-fetches title, author, cover, and metadata
- organize with status (to read / reading / read), ratings, notes, tags
- search, filter, sort your whole library
- export anywhere: JSON, CSV, Goodreads, LibraryThing, Google Sheets
- import and merge automatically: JSON, CSV, Goodreads, LibraryThing
- works offline as a PWA — install it and it's feels a native app

## WHAT

`BOOK BAT` and `BAOBAB` are one ecosystem. a symbiotic relationship.

BOOKBAT flies around with you:

- up the Shelves
- into Town Center Libraries, 
- Aat Street Book Fairs. 
- teachers use BOOKBAT to put together Courses. 
- friends use to quickly meno some titles they plan to AudioRead!

BAOBAB keeps the booklists, for storage and **sharing is caring!**:

- presents 
- browse
- share interesting read on your blog
- extends it across static/client surfaces
- demo
 
technically :
 
- `BOOK BAT` is the active app layer: scan, edit, organize, export. a dead-simple book library app. point your camera at a barcode, get the book info, done. everything stays on your device in localStorage. nothing leaves the browser.

- `BAOBAB` is the component client layer bulit on Astro cos we no need extra JS: a rooted, statically rendered, durable view of your library data.






## STACK

svelte 5 + vite + astro (workspace). pure static clients. local storage and ISBN lookup logic.

## MONOREPO

- `apps/webapp` → current BOOK BAT app
- `apps/astro-site` → Astro SSG site with `BOOK BAT CLIENT`
- `packages/library-core` → shared types + list/search/sort helpers

## RUN IT

```bash
pnpm install
pnpm dev:webapp
pnpm dev:astro
```

## HTTPS DEV (LOCAL + LAN PHONE)

Generate local certs (includes localhost + detected LAN IPv4 addresses):

```bash
pnpm certs:generate
```

Run webapp over HTTPS:

```bash
pnpm dev:webapp:https
```

Open:

- `https://localhost:5173`
- `https://<your-lan-ip>:5173` (phone on same Wi-Fi)

Note: phone browsers may still require trusting the local cert before camera APIs behave as secure context.

## ASTRO JSON INPUT

Canonical drop-in files:

- `data/library.json` (default dataset)
- `data/library.dummy.json` (optional demo dataset)

The workspace auto-syncs `data/library.json` to:

- `apps/astro-site/src/data/library.json`
- `apps/webapp/src/public/library.json`

Run manually:

```bash
pnpm data:sync
pnpm data:sync:dummy
pnpm data:apply ./my-export.json
```

Note: Astro SSG cannot write back to repo files from the browser at runtime.  
Use `data:apply` (or replace `data/library.json`) to persist edits into the drop-in folder.

Supported shape (`data/library.json`):

```json
{
  "version": 1,
  "books": []
}
```

## LICENSE

[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.en) — share it, remix it, just keep it open.


## COMMERCIAL

want to use our SDK or build something commercial? hit us up at **info@junglestar.org**
