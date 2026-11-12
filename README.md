# Kolli

Find someone watching the same thing, then watch it together.

A guest picks a display name, confirms they are 18+, and chooses a title. If
someone else picks the same title within 5 minutes, both are paired into a
lobby with live chat and a shared Kosmi room link.

## Run it

```sh
npm install
npm run dev
```

Open http://localhost:8080

## Pages

| Path | What it is |
| --- | --- |
| `/` | Join, pick a title, wait for a match |
| `/lobby/$matchId` | Chat and shared room for a match |
| `/privacy` | Privacy notice |

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production |
| `npm run test` | Run tests |
| `npm run lint` | Check code style |

## Built with

TanStack Start, TypeScript, React, Tailwind CSS, Lovable Cloud.
