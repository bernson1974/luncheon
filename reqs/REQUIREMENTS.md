# Kravdokument – Luncheon MVP

**Projekt:** Lindholmen Lunch Matching  
**Version:** 2.0  
**Datum:** 2026-03-19  
**Status:** Utkast

> **Konceptbyte (v2.0):** Den algoritmbaserade matchningsmodellen är ersatt med en öppen anslagstavla där användare antingen *lägger upp* en lunchdejt eller *joinar* en befintlig.

---

## 1. Syfte och bakgrund

Luncheon är en app för Lindholmen i Göteborg vars syfte är att minska ensamluncher. Modellen bygger på ett enkelt publicerings- och join-flöde:

- Vill du ha sällskap? Lägg upp en lunchdejt med tid, restaurang och samtalsämne.
- Vill du gå med i någons dejt? Bläddra bland öppna lunchdejtar och joina en som passar.

Inga komplicerade algoritmer – användaren väljer själv.

---

## 2. Kärnprinciper

| Princip | Beskrivning |
|---|---|
| Inga publika profiler | Inga profilsidor, ingen sökfunktion efter personer, ingen synlig historik. |
| Planeringsfönster | Lunchdejtar planeras inom **idag + fem dagar** (Stockholmstid). Varje dejt gäller ett valt datum inom fönstret. |
| En lunch per dag | En användare kan som mest vara skapare eller deltagare på **en** lunchdejt per kalenderdag. |
| Låg friktion, hög integritet | Minimalt med personuppgifter – alias synligt enbart inom bekräftad grupp. |
| Användarstyrt | Inga dolda algoritmer; användaren ser och väljer öppet. |

---

## 3. Användarflöde – översikt

```
Screen 0: Välkommen & Område
       ↓ (välj Lindholmen)
Screen 1: Startsida – välj roll
       ├─ "Lägg upp lunchdejt" ──→ Screen 2a: Skapa dejt
       │                                 ↓ (publicera)
       │                           Screen 3: Mina dejtar / Väntar på deltagare
       │
       └─ "Hitta en lunchdejt" ──→ Screen 2b: Bläddra & filtrera
                                         ↓ (välj dejt och joina)
                                   Screen 3: Bekräftelse / Detaljer
```

---

## 4. Funktionella krav

### 4.1 Skapa lunchdejt

| ID | Krav |
|---|---|
| FR-01 | Användaren ska kunna ange ett alias/visningsnamn. |
| FR-02 | Användaren ska kunna ange **klockslag** för lunchen (starttid och eventuell sluttid). |
| FR-03 | Användaren ska kunna ange eller välja **restaurang** (från en kurerad lista för Lindholmen). |
| FR-04 | Användaren ska kunna ange ett **samtalsämne** (fritext, t.ex. "AI och framtidens jobb", "Premier League"). |
| FR-05 | Användaren ska kunna ange hur många fler deltagare som är välkomna (max antal platser). |
| FR-06 | En lunchdejt är kopplad till ett **valt datum** inom planeringsfönstret (idag + fem dagar) och området Lindholmen. |
| FR-07 | En publicerad lunchdejt ska vara synlig för andra användare i listvyn direkt efter publicering. |
| FR-08 | Skaparen ska kunna **avboka** sin lunchdejt (MVP: dejten markeras som avbokad; exakt policy för deltagare kan förenklas). |

### 4.2 Bläddra och filtrera lunchdejtar

| ID | Krav |
|---|---|
| FR-09 | Användaren ska kunna se en lista med öppna lunchdejtar inom planeringsfönstret på Lindholmen, med valfri **dagfiltrering**. |
| FR-10 | Listan ska kunna filtreras på **klockslag** (t.ex. "visa dejtar som startar mellan 11:30–13:00"). |
| FR-11 | Listan ska kunna filtreras på **restaurang**. |
| FR-12 | Listan ska kunna filtreras på **samtalsämne** (fritextsök eller förvald tagg). |
| FR-13 | Varje listpost ska visa: klockslag, restaurangnamn, samtalsämne, antal lediga platser. |
| FR-14 | Filter ska kunna kombineras fritt. |
| FR-15 | En dejt som är fullbokad (inga lediga platser kvar) ska antingen döljas eller tydligt markeras som full. |

### 4.3 Joina en lunchdejt

| ID | Krav |
|---|---|
| FR-16 | Användaren ska kunna klicka in på en lunchdejt och se dess detaljer (tid, restaurang, samtalsämne, befintliga deltagares alias). |
| FR-17 | Användaren ska kunna **joina** en lunchdejt. |
| FR-18 | Efter join ska användaren se en bekräftelseskärm med fullständiga detaljer: tid, restaurang, samtalsämne och alla deltagares alias. |
| FR-19 | Användaren ska kunna **lämna** en dejt som de har joinat (MVP: när som helst innan vidare produktregler). |
| FR-20 | När en användare joinar ska antalet lediga platser minska med ett i realtid (eller vid nästa sidladdning). |

### 4.4 Restaurangdata

| ID | Krav |
|---|---|
| FR-21 | Systemet ska innehålla en manuellt kurerad lista av restauranger på Lindholmen. |
| FR-22 | Varje restaurang ska ha: namn, koordinater (lat/lng), kök och öppettider per veckodag. |
| FR-23 | Vid val av restaurang vid skapande av dejt ska systemet kontrollera att restaurangen är öppen vid det angivna klockslaget (**mål**; i MVP kan kontrollen vara förenklad eller saknas). |

---

## 5. Icke-funktionella krav

| ID | Krav |
|---|---|
| NFR-01 | **Integritet**: Deltagarnas alias exponeras enbart för dem som är med i samma lunchdejt. |
| NFR-02 | **Responsivitet**: UI:t ska vara mobile-first och fungera på små skärmar, men även skalas upp till desktop. |
| NFR-03 | **Realtid (önskvärt)**: Antalet lediga platser och listan med lunchdejtar ska uppdateras utan att användaren behöver ladda om sidan. |
| NFR-04 | **Tillgänglighet**: Hög kontrast och läsbar typografi (WCAG AA som miniminivå). |
| NFR-05 | **Enkelhet**: Tydlig primäråtgärd per **flöde**; startsidan får ha flera snabbval (t.ex. karta + kort åtgärder) utan att konkurrera visuellt. |

---

## 6. Datamodell (konceptuell)

### Restaurant
| Fält | Typ | Beskrivning |
|---|---|---|
| `id` | string/uuid | Unik identifierare |
| `name` | string | Restaurangens namn |
| `latitude` | number | Latitud |
| `longitude` | number | Longitud |
| `cuisine` | string | T.ex. `"indian"`, `"thai"`, `"swedish"` |
| `openingHours` | object | Öppettider per veckodag |

### LunchDate (ny central entitet)
| Fält | Typ | Beskrivning |
|---|---|---|
| `id` | string/uuid | Unik identifierare |
| `creatorAlias` | string | Skaparens alias |
| `creatorUserId` | string | Intern identifierare (visas ej) |
| `date` | date | Datum för lunchen |
| `area` | string | T.ex. `"Lindholmen"` |
| `timeStart` | time | Lunchen börjar |
| `timeEnd` | time | (Valfritt) Lunchen slutar |
| `restaurantId` | string | Koppling till Restaurant |
| `topic` | string | Samtalsämne (fritext) |
| `maxParticipants` | number | Max antal deltagare inkl. skaparen |
| `status` | enum | `open` \| `full` \| `cancelled` |

### Participant
| Fält | Typ | Beskrivning |
|---|---|---|
| `id` | string/uuid | Unik identifierare |
| `lunchDateId` | string | Koppling till LunchDate |
| `userId` | string | Intern identifierare (visas ej) |
| `alias` | string | Alias synligt för övriga deltagare |
| `joinedAt` | timestamp | Tidpunkt för join |

---

## 7. Skärmar

### Screen 0 – Välkommen & Område
- Kort introduktion om appens syfte.
- Val av område; i MVP är enbart `Lindholmen` valbart.

### Screen 1 – Startsida
- Översikt (t.ex. karta) och **snabbval**: Min lunch (om bokad), lägg upp dejt, hitta dejt.
- **"Lägg upp lunchdejt"** → Screen 2a.
- **"Hitta en lunchdejt"** → Screen 2b.

### Screen 2a – Skapa lunchdejt
- Formulär med:
  - **Dag** (inom planeringsfönstret)
  - Alias
  - Klockslag (start, valfri sluttid)
  - Restaurangval (dropdown/sökning ur kurerad lista)
  - Samtalsämne (fritext)
  - Max antal deltagare
- Validering: restaurangen måste vara öppen vid angivet klockslag.
- Primäråtgärd: **"Publicera lunchdejt"**.

### Screen 2b – Bläddra lunchdejtar
- Lista med öppna lunchdejtar inom planeringsfönstret på Lindholmen; filter inkl. **valfri dag**.
- Filterrad: klockslag, restaurang, samtalsämne.
- Varje listpost visar: tid, restaurang, samtalsämne, `X platser kvar`.
- Klick på en post öppnar detaljer (inline eller ny skärm).

### Screen 3a – Min publicerade dejt (skaparvy)
- Visar detaljer om dejten.
- Visar alias på deltagare som har joinat.
- Åtgärder: **"Stäng för fler"** / **"Ta bort dejt"** (om inga deltagare).

### Screen 3b – Bekräftelse / Detaljer (joinar-vy)
- Bekräftar att användaren har joinat.
- Visar: tid, restaurang, samtalsämne, alla deltagares alias (inkl. skaparen).
- Åtgärd: **"Lämna dejten"**.

---

## 8. Avgränsningar (MVP)

### Ingår
- Enskilt område: Lindholmen.
- Manuellt kurerad restauranglista.
- Skapa, publicera och ta bort lunchdejtar.
- Filtrerbar listvy för att hitta och joina lunchdejtar.
- Enkel bekräftelse och lämna-funktion.

### Ingår **inte** (MVP)
- Chatt eller meddelandefunktion.
- Notifikationer (push/e-post) när någon joinar.
- Vänlistor, följ-system eller socialt nätverk.
- Betyg, recensioner eller rykte.
- Publika profiler eller sökbara användare.
- Stöd för fler städer eller områden utanför Lindholmen.
- Återkommande lunchdejtar.

---

## 9. UI-riktlinjer

| Riktlinje | Beskrivning |
|---|---|
| Layout | Mobile-first; skalbar till desktop. |
| Tema | Rent, minimalt, ljust med hög kontrast och läsbar typografi. |
| Komponenter | Enkla kort för lunchdejtar i listvyn; tydlig detalj-vy vid join. |
| Knappar | En tydlig primäråtgärd per skärm med accentfärg; sekundära åtgärder visuellt dämpade. |
| Ton | Lugn, trygg, rakt på sak. Kopior ska vara korta och sänka tröskeln för att prova appen. |

---

## 10. Öppna frågor

| # | Fråga | Ansvarig | Status |
|---|---|---|---|
| 1 | Krävs autentisering i MVP, eller räcker ett anonymt sessions-ID per enhet? | Tech/Produkt | Öppen |
| 2 | Ska deltagarnas alias visas för alla som ser listan, eller enbart för de som joinat? | Produkt | Öppen |
| 3 | Ska skaparen behöva godkänna varje join (opt-in) eller är det automatiskt? | Produkt | Öppen |
| 4 | Hur hanteras dejtar vars tid har passerat – tas de bort automatiskt? | Tech | Öppen |
| 5 | Vilka konkreta restauranger ska ingå i den initiala listan för Lindholmen? | Produkt | Öppen |
| 6 | Ska samtalsämnen vara fritexts eller förvaldda taggar (eller båda)? | Produkt | Öppen |
