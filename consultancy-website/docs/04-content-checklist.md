# 04 · Content checklist — what the client must supply

The website is built. What it now needs is **truth**: real names, real numbers,
real photos. Every item below is currently a placeholder.

Give this list to the client as-is. Nothing here needs technical skill.

---

## A. Must have before launch (blocking)

| # | Item | Where it goes | Notes |
|---|---|---|---|
| 1 | Final business name | `site.config.json` → `brand`, `brandShort` | Then run `node tools/rebrand.mjs "Name" "Short"` |
| 2 | Legal entity name | `legalName` | e.g. "Disha Consultancy Services" — appears in the legal pages |
| 3 | Mobile number (the one you will actually answer) | `contact.phone`, `phoneHref` | `phoneHref` has no spaces: `+919000000000` |
| 4 | WhatsApp number | `contact.whatsapp` | Digits only with country code: `919000000000` |
| 5 | Email address | `contact.email`, `supportEmail` | On your own domain — see [02](02-brand-domain-email.md) |
| 6 | Office address | `contact.addressLine`, `city`, `state`, `postalCode` | If you have no office, remove the address block from `contact.html` and the footer rather than inventing one |
| 7 | Working hours | `contact.hours` | Be realistic — it sets expectations |
| 8 | Website domain | `url` | Used for canonical URLs and the sitemap |
| 9 | **Real fees** | `pricing.*` | Replace ₹1,500 / ₹4,999 / ₹14,999 placeholders |
| 10 | Founder name, qualifications, photo | `founder.*` and `about.html` | **The single biggest trust factor on the site** |
| 11 | Whether GST applies | `pricing` text on `pricing.html` | Remove "+ GST" everywhere if you are not registered |
| 12 | Legal pages reviewed | `src/pages/legal/*.html` | Remove the yellow "Template notice" boxes after review |
| 13 | Social media URLs | `social.*` | Delete any you don't have — dead links look worse than none |

---

## B. Should have at launch (strongly recommended)

| # | Item | Where | Why |
|---|---|---|---|
| 14 | 3–6 **real** testimonials with written consent | `index.html` testimonials section | The current three are clearly marked samples. Using fabricated testimonials breaches consumer-protection rules — replace or delete them. |
| 15 | Real statistics | Hero + "why us" section | "2,400+ students" and "12+ years" are placeholders. Use numbers you can evidence, or remove the block. |
| 16 | Founder photograph | `about.html` | A real face doubles trust. Plain background, good light, phone camera is fine. |
| 17 | Office / session photographs | About page | Optional but humanising |
| 18 | Google Business Profile listing | External | See [06](06-seo-and-marketing.md) |
| 19 | Bank account + payment link | External | Needed before you can take fees — [07](07-payments-and-gst.md) |

> **On statistics and testimonials:** the CCPA advertising rules for this sector
> take unverifiable success claims seriously. If you cannot produce the records
> behind a number, do not publish the number. An honest site with fewer claims
> converts better than an inflated one anyway — parents have been lied to a lot.

---

## C. Nice to have (post-launch)

| # | Item | Where |
|---|---|---|
| 20 | A short founder video (60–90 s, phone camera) | Home page hero or About |
| 21 | Anonymised case studies ("Rank 45,000 → BDS in a government college") | New blog posts |
| 22 | Downloadable checklist as a lead magnet | Blog / contact page |
| 23 | Session photographs or a webinar recording | About / blog |
| 24 | Certifications and memberships | About page |
| 25 | A Hindi version of the key pages | Whole site (see [10](10-maintenance.md)) |

---

## D. Photo brief (send this to the client verbatim)

- **Founder headshot:** phone camera is fine. Stand facing a window, plain wall
  behind, shoulders up, no sunglasses, smile. Take 20, pick one.
- **Office:** wide shot of the room where sessions happen; one of the desk setup.
- **Session (with consent):** counsellor and client from behind or side, faces
  not identifiable, unless you have written permission.
- **Format:** JPG, at least 1600 px on the long edge, under 500 KB after
  compression (use squoosh.app — free, in-browser).
- **Never** use stock photos of foreign models. Indian families spot it
  instantly and it reads as a fake business.

---

## E. The exact edits, for whoever is doing them

**1. Almost everything is in one file — `site.config.json`:**

```jsonc
{
  "brand": "Your Brand Name",
  "url": "https://www.yourbrand.com",
  "contact": {
    "phone": "+91 98765 43210",
    "phoneHref": "+919876543210",
    "whatsapp": "919876543210",
    "email": "hello@yourbrand.com"
  },
  "pricing": { "session": "2,000", "counsellingPack": "5,999" }
}
```

Then:

```bash
npm run check      # rebuilds and verifies everything
npm run dev        # preview at http://localhost:8080
```

**2. Page text** lives in `src/pages/`. It is ordinary HTML — edit the words
between the tags, leave the tags alone. Never edit `dist/`: it is regenerated
on every build and your changes will be wiped.

**3. Removing a section** you don't want: delete the whole `<section>…</section>`
block from the page and rebuild.

**4. Removing the sample testimonials:** delete the testimonials `<section>` in
`src/pages/index.html` until you have real ones. An empty space is better than
invented praise.
