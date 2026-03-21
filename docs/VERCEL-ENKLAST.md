# Vercel utan Git-webhook (mest pålitligt)

Om inget nytt dyker upp under **Deployments** när du pushar till GitHub, **strunta i det till att börja med**. Deploya från **din dator** i stället – då behövs ingen webhook.

## Krav

- Du har kört `npm install` i projektmappen och `npm run build` fungerar lokalt.

## Steg (kör i Terminal)

```bash
cd /Users/mattiasbernson/Desktop/Luncheon
npx vercel login
npx vercel
```

Svara på frågorna (konto, projekt – välj befintligt **luncheon-mvp** eller skapa nytt).

När det gått igenom får du en **preview-URL**.

För **produktion** (fast länk du kan dela):

```bash
npx vercel --prod
```

Det är allt. Ingen “Build”-knapp i webben, ingen Git-koppling för första gången.

## Om du vill ha auto-deploy från Git senare

Först när ovan fungerar: **Vercel → Project → Settings → Git** och koppla `bernson1974/luncheon`. Om det strular igen har du ändå **CLI** som alltid kan deploya.

## Om `npx vercel` klagar

Klistra in **hela** feltexten från terminalen (eller skärmdump) – då är det konkret fel att felsöka, inte gissningar.
