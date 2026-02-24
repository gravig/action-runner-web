# Action Runner Web

Vite + React + TypeScript starter with Tailwind CSS and Sass ready to style.

## Prerequisites
- Node.js >= 20.19 (required by Vite 7)
- npm

## Getting started
1) Install dependencies: `npm install`
2) Start the dev server: `npm run dev`
3) Lint the project: `npm run lint`
4) Build for production: `npm run build`
5) Preview the production build: `npm run preview`

## Styling
- Global styles live in `src/index.scss` with Tailwind directives.
- Tailwind is configured in `tailwind.config.js`; extend theme tokens as needed.
- Add Sass variables or mixins alongside Tailwind utilities for bespoke components.

## Project layout
- `src/main.tsx` bootstraps React with the global styles.
- `src/App.tsx` hosts the sample landing layout and feature cards.
- `postcss.config.js` wires Tailwind and Autoprefixer into the build.
