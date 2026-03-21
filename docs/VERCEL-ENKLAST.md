# Vercel – varför våra tidigare “klicka här”-steg kan vara fel

**Jag (AI) ser inte Vercels dashboard.** Menytext, layout och språk ändras. Därför ska du **inte** lita på att steg som “gå till X → Y” från en chatt alltid stämmer med det du ser.

**Använd Vercels egna dokumentation** när du navigerar på webben:

| Vad du vill göra | Officiell sida (engelska) |
|------------------|---------------------------|
| Hur deployment funkar (Git, CLI, hooks) | https://vercel.com/docs/deployments/overview |
| Koppla Git / importera repo | https://vercel.com/docs/git |
| Deploy **från terminal** (pålitligt, samma kommando över tid) | https://vercel.com/docs/projects/deploy-from-cli |
| Vercel CLI (alla kommandon) | https://vercel.com/docs/cli |

---

## Deploy från terminal (enligt Vercels egen guide)

Detta är **inte** beroende av att hitta rätt knapp på deras sajt.

1. Installera CLI (välj ett sätt – från [Vercel CLI docs](https://vercel.com/docs/cli)):

   ```bash
   npm i -g vercel
   ```

   Eller utan global install: `npx vercel` i stället för `vercel` i kommandona nedan.

2. I **projektroten** (mappen som innehåller `package.json`):

   ```bash
   cd /Users/mattiasbernson/Desktop/Luncheon
   vercel login
   vercel link
   ```

   `vercel link` kopplar mappen till ett Vercel-projekt (skapar mappen `.vercel/` – den är **gitignorad** i det här repot).

3. **Preview:**

   ```bash
   vercel deploy
   ```

4. **Produktion:**

   ```bash
   vercel deploy --prod
   ```

Exakt ordning och extra steg finns här: **https://vercel.com/docs/projects/deploy-from-cli**

---

## Om något går fel

- Öppna **samma sida** som ovan och jämför med din terminal – Vercel ändrar sällan CLI på samma sätt som dashboard.
- Klistra in **hela** felmeddelandet från terminalen om du ber någon (eller en AI) om hjälp – då slipper ni gissa.
