# Prep Atlas

Prep Atlas is a visual workspace for web developer interviews. Pick a line of JavaScript to see where a variable comes from, change an array to trace a binary search, or switch SQL join types and watch the result rows change.

## Run locally

Use Node.js 20.9 or later and npm.

```sh
git clone https://github.com/krn011/Prep-Atlas.git
cd Prep-Atlas
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Lessons and fonts ship with the app. The study workspace runs without an API key or database.

## What you can study

The 61 labs cover eight tracks. Add a notebook to a cart, switch chat rooms, roll back a transfer, or reorder a list while editing a row. Practice includes predicting results and comparing them with the worked examples.

| Track | Example |
| --- | --- |
| JavaScript | Trace a variable through block, function, and script scopes. |
| TypeScript | Follow a union through each branch of a type check. |
| React and Next.js | Track a state update from a click to a DOM change. |
| Backend and APIs | Follow a request through middleware and its handler. |
| Databases | Compare rows returned by inner, left, right, and full joins. |
| Data structures and algorithms | Change the input and step through two pointers, sliding window, or binary search. |
| System design | Follow a cache miss to the database and a repeat request back to the cache. |
| Interview practice | Rehearse a project decision and explain how you verified the result. |

Use **Topic atlas** to browse by track or **⌘K / Ctrl+K** to search lessons and blueprint notes. The seven-month roadmap and lesson checklists save progress in the current browser using local storage.

## Check and build

```sh
npm run typecheck
npm run build
npm start
```

The build exports the site to `out/`. The start command serves that directory locally using `serve` through npx. For deployment, publish the contents of `out/` to a static host at the site root.

## Working on lessons

| Location | Purpose |
| --- | --- |
| `content/curriculum.ts` | Track definitions and the lesson data model |
| `content/lessons.ts` | Main lesson list and registration |
| `content/algorithms.ts` | Algorithm examples and input-driven traces |
| `content/blueprint.md` | Full preparation syllabus and roadmap |
| `app/lab.tsx` | Code display, playback controls, comparisons, and exercises |
| `app/visuals.tsx` | SQL join explorer, rendering comparison, and growth chart |
| `app/globals.css` | Ivory and charcoal theme, layout, and accessible motion |
| `public/fonts/` | Self-hosted Open Sans and its license |

The app uses the Next.js App Router, TypeScript, React, GSAP, and Lucide icons.
