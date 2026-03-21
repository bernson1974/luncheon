# Luncheon (Lindholmen MVP)

Next.js-app för lunchdejtar på Lindholmen.

## Köra lokalt

```bash
cd Luncheon
npm install
npm run dev
```

Öppna **http://localhost:3000** i webbläsaren (http, inte https).

**Mobil på samma Wi‑Fi:**

```bash
npm run dev:lan
```

Använd datorns IP-adress, t.ex. `http://192.168.x.x:3000`.

## Om något strular lokalt

1. Stoppa `npm run dev` (Ctrl+C).
2. Rensa och installera om:

   ```bash
   npm run reinstall
   ```

   (Kräver Mac/Linux. På Windows: radera mapparna `node_modules` och `.next` manuellt, kör sedan `npm install`.)

3. Starta igen: `npm run dev`.

**”Connection failed” i webbläsaren** betyder nästan alltid att **ingen** kör `npm run dev` – starta servern och låt terminalfönstret vara öppet.

**”Another next dev server is already running”** eller fel port: du har redan en `next dev` igång. Stoppa den med **Ctrl+C** i den terminalen, eller kör `kill <PID>` (PID står i felmeddelandet). Öppna sedan **samma port** som terminalen visar (3000 eller 3001).

## GitHub & Vercel

- Kod pushas till GitHub med `git add` / `git commit` / `git push`.

**Vercel utan krångel:** om inget händer i dashboard efter `git push`, deploya från terminal med **`npx vercel`** / **`npx vercel --prod`** – se **[docs/VERCEL-ENKLAST.md](./docs/VERCEL-ENKLAST.md)** (kringgår trasiga Git-webhooks).

**Om Vercel-build failar:** lägg **inte** `NODE_ENV=production` som miljövariabel för hela projektet i Vercel (då kan install-steget hoppa över paket och `next build` kraschar). Använd bara standardinställningar, eller sätt `NODE_ENV` endast där Vercel föreslår det för runtime.

## Övrigt

- `npm run check` kör produktionsbygge (`next build`).
- Data i MVP är in-memory och passar bäst för demo lokalt; i produktion behövs databas.
