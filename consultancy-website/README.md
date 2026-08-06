# 🧭 Consultancy Website — complete, ready to deploy

A full marketing website for a career, education and life-direction consultancy
in India — plus the legal, deployment and go-to-market documentation needed to
actually run the business behind it.

**22 pages. Zero dependencies. Deploys free.**

---

## Quick start

```bash
cd consultancy-website
npm run dev        # → http://localhost:8080
```

There is no `npm install` step. The build script uses only Node's standard
library, so it needs nothing but Node 18+.

```bash
npm run build      # build src/ → dist/
npm run check      # build, then verify every internal link and meta tag
npm run dev        # preview with auto-rebuild on save
npm run og         # regenerate the social share image
npm run fonts      # re-download the self-hosted web fonts
npm run server     # optional: run the lead-capture API + site on port 3000
```

---

## What's in the box

### The website (`src/` → `dist/`)

| Section | Pages |
|---|---|
| Core | Home · About · Services hub · Pricing · Contact · FAQ |
| Services | NEET & medical · JEE/IIT & engineering · Class 9–12 stream choice · Jobs & career switch · Study abroad · Life clarity coaching |
| Insights | Blog index + 3 full-length guides (NEET counselling, branch vs. college, career switch after 30) |
| Legal | Privacy policy · Terms of service · Refund & cancellation · Disclaimer |
| Utility | Thank-you page · 404 · sitemap.xml · robots.txt · web manifest |

**Built in:** responsive layout, sticky header with mobile drawer, lead form with
client-side validation and a spam honeypot, WhatsApp + call floating buttons,
FAQ accordions, scroll reveals, count-up statistics, structured data
(ProfessionalService + FAQPage), Open Graph image, self-hosted fonts,
security headers, and accessible focus/reduced-motion handling.

**Compliance built in** (this sector has real rules — see `docs/05`):
no-guarantee and no-affiliation statements on every page, explicit consent and
guardian-consent checkboxes, a named grievance officer, mental-health helpline
referral, no ad trackers, and no third-party font requests carrying visitors' IPs.

### The optional backend (`backend/server.js`)

A zero-dependency Node server that stores enquiries on your own machine:
`POST /api/lead`, token-protected `/api/leads` + CSV export, and an `/admin`
dashboard. Rate-limited, honeypot-aware, path-traversal safe. **Not required** —
the site works on free static hosting without it.

### The documentation (`docs/`)

| File | Covers |
|---|---|
| [00-START-HERE.md](docs/00-START-HERE.md) | The full A–Z plan, week by week, with costs |
| [01-legal-company-registration.md](docs/01-legal-company-registration.md) | Entity choice, Udyam/LLP/Pvt Ltd steps, GST, income tax, sector-specific licensing |
| [02-brand-domain-email.md](docs/02-brand-domain-email.md) | Naming, trademark check, domain, business email + DNS records |
| [03-deployment.md](docs/03-deployment.md) | Which cloud and why; Cloudflare/Netlify/Vercel walkthroughs; full VPS setup with Nginx, Certbot, systemd, backups |
| [04-content-checklist.md](docs/04-content-checklist.md) | Everything the client must supply before launch |
| [05-compliance-and-risk.md](docs/05-compliance-and-risk.md) | Advertising rules, minors' data, scope boundaries, insurance |
| [06-seo-and-marketing.md](docs/06-seo-and-marketing.md) | Google Business Profile, keywords, 12-month content calendar, ads |
| [07-payments-and-gst.md](docs/07-payments-and-gst.md) | Gateway onboarding, invoicing, GST, pricing strategy |
| [08-operations-and-tools.md](docs/08-operations-and-tools.md) | Pipeline, tools, assessments, session structure, capacity |
| [09-launch-checklist.md](docs/09-launch-checklist.md) | The tick-list before you announce |
| [10-maintenance.md](docs/10-maintenance.md) | How to change anything, and handover notes |

---

## Making it yours

Almost everything lives in **one file**:

```bash
$EDITOR site.config.json      # brand, phone, WhatsApp, email, address, fees
npm run check                 # rebuild + verify
```

To change the business name everywhere (titles, copy, share image, manifest):

```bash
node tools/rebrand.mjs "Your Business Name" "Short"
npm run og
npm run check
```

Page text is ordinary HTML in `src/pages/`. **Never edit `dist/`** — it is
regenerated on every build.

---

## Deploying

**Recommended: Cloudflare Pages** — free, unlimited bandwidth, excellent India
latency, automatic HTTPS.

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `consultancy-website`

`netlify.toml` and `vercel.json` are included for those platforms, and
`deploy/` has an Nginx config, a hardened systemd unit and an rsync deploy
script for a VPS. Full instructions, including which provider and region to pick
in India: [docs/03-deployment.md](docs/03-deployment.md).

---

## How it's built, and why

A ~200-line Node script (`tools/build.mjs`) assembles pages from `src/pages/`
and `src/partials/` with a deliberately tiny template syntax — `{{ value }}`,
`{{> partial }}`, `{{{ content }}}` — and generates the sitemap from what it
actually built. `tools/check.mjs` is the test suite: it fails the build on
broken internal links, duplicate or over-long titles, missing meta descriptions,
missing `alt` text, wrong heading structure, or unresolved template tokens.

No framework was used on purpose. The owner is not a developer, and the site has
to still build, deploy and be editable years from now without a dependency
upgrade treadmill.

```
consultancy-website/
├── site.config.json        ← edit this first
├── src/
│   ├── layouts/base.html   ← <head>, header/footer slots, structured data
│   ├── partials/           ← header, footer, lead form, CTA band, sidebar
│   ├── pages/              ← every page's content
│   ├── assets/             ← css, js, fonts, images
│   └── static/             ← _headers, site.webmanifest
├── tools/                  ← build, check, dev server, rebrand, fonts, OG image
├── backend/server.js       ← optional lead API + admin dashboard
├── deploy/                 ← nginx.conf, systemd unit, deploy.sh
├── docs/                   ← the A–Z business documentation
└── dist/                   ← generated output (this is what you deploy)
```

---

## Before you launch

Run through [docs/09-launch-checklist.md](docs/09-launch-checklist.md). The two
items people skip, and must not:

1. **Replace the sample testimonials and statistics** with real, evidenced ones —
   or delete them. They are clearly marked as placeholders in the source.
2. **Have the four legal pages reviewed** and remove the yellow template notices.

---

## Licence

Written for a specific client engagement. The Fraunces and Plus Jakarta Sans
fonts in `src/assets/fonts/` are licensed under the SIL Open Font License 1.1;
all other code and content here is the client's.
