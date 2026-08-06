# 02 · Brand name, domain and business email

---

## 1. Choosing the name

Test each candidate against all five before you fall in love with it:

1. **Say it on a phone call.** If the person has to ask "spelling kya hai?",
   it costs you leads forever.
2. **Trademark search** — free, on the IP India public search. Rejecting a name
   now is free; rebranding in year two is not.
3. **Domain available** — ideally the `.com` *and* the `.in`.
4. **Social handles free** — Instagram and YouTube matter most for this audience.
5. **Not a coaching-institute clone.** Avoid "Academy", "Institute", "Classes",
   "Career Point"-style names — they signal coaching, which invites a different
   (and more heavily regulated) set of expectations. You sell guidance.

**Naming directions that work in this market:**

| Direction | Examples | Feel |
|---|---|---|
| Hindi/Sanskrit concept word | Disha, Sankalp, Pathya, Drishti, Nirnay | Warm, memorable, local trust |
| Founder-led | "Sharma Career Advisory" | Personal accountability, good for referrals |
| Descriptive English | "Clear Path Careers" | Instantly understood, harder to trademark |
| Compound | "CareerCompass", "NextStep Guidance" | Modern, .com often taken |

The site currently ships as **"Disha Consultancy"** (disha = direction). It is a
placeholder — one command changes it everywhere:

```bash
node tools/rebrand.mjs "Your Real Name" "Short"
npm run og      # regenerate the social share image
npm run check   # rebuild and verify
```

---

## 2. Domain

**Buy from:** Cloudflare Registrar (at-cost pricing, no renewal games — needs a
free Cloudflare account), or Namecheap / GoDaddy / BigRock / Hostinger.

**Costs, indicative:**

| TLD | First year | Renewal | Notes |
|---|---|---|---|
| `.com` | ₹800–1,200 | ₹1,100–1,600 | Default choice. Buy this if free. |
| `.in` | ₹500–900 | ₹700–1,200 | Strong local signal for Indian audiences. |
| `.co.in` | ₹500–900 | ₹700–1,200 | Fine alternative if `.in` is gone. |
| `.org` / `.co` | ₹900–2,500 | ₹1,200–2,800 | Only if the others are unavailable. |

**Rules of thumb**

- Buy **both `.com` and `.in`** if the budget allows (~₹1,800 total) and redirect
  one to the other. It blocks a competitor from taking your name in the other TLD.
- **Turn on auto-renew and WHOIS privacy.** Expired domains get bought within
  hours by squatters, and recovering one is expensive.
- Watch the **renewal** price, not the ₹99 first-year offer.
- Avoid hyphens and numbers.
- Prefer **`www.yourname.com`** as your canonical host and redirect the bare
  domain to it (or vice versa — just pick one; both indexed splits your SEO).

**After buying:** point DNS at your host — exact records are in
[03-deployment.md](03-deployment.md).

---

## 3. Business email

`hello@yourbrand.com` converts better than `yourbrand2024@gmail.com`. Parents
paying ₹15,000 notice this.

| Option | Cost | Good for |
|---|---|---|
| **Zoho Mail free plan** | **₹0** for up to 5 users, custom domain, 5 GB each | Starting out. Genuinely fine. |
| Zoho Mail paid | ~₹60–100/user/month | More storage, better support |
| **Google Workspace Business Starter** | ~₹136–210/user/month + GST | If you already live in Gmail/Meet/Drive |
| Microsoft 365 Business Basic | ~₹145–200/user/month | If you need Office apps |
| Email forwarding only | ₹0 (Cloudflare Email Routing) | Receive on your domain, send from Gmail |

**Recommended start:** Zoho free tier, or Cloudflare Email Routing forwarding to
an existing Gmail. Upgrade to Google Workspace once you have staff or need
shared calendars.

**Addresses to create:**

- `hello@` (or `info@`) — public enquiry address, used on the website
- `support@` — grievance/refund address, referenced in the legal pages
- `accounts@` — invoices (optional at first)
- Founder's own `name@`

### Do not skip the DNS email records

Without these, your emails go to spam:

- **SPF** — `v=spf1 include:<your provider> ~all`
- **DKIM** — the key your provider gives you
- **DMARC** — start with `v=DMARC1; p=none; rua=mailto:you@yourdomain.com`, and
  tighten to `p=quarantine` once reports look clean

Your email provider's setup wizard gives the exact values. Test at
mail-tester.com — aim for 9/10 or better.

---

## 4. Social handles and Google

Claim these on the day you buy the domain, even if you won't post for a month:

- **Google Business Profile** — the single highest-ROI free listing for a local
  consultancy. See [06-seo-and-marketing.md](06-seo-and-marketing.md).
- **Instagram** — where students and parents actually are
- **YouTube** — long-form counselling explainers rank and build trust
- **LinkedIn** — for the working-professional side of the business
- **WhatsApp Business** — with a catalogue, greeting message and away message

Use the same handle everywhere. Put the logo (`src/assets/img/logo.svg`) as the
profile picture on all of them.

---

## 5. Logo

The repo ships a clean compass-star mark in `src/assets/img/`. It is
deliberately simple and generic-safe. When you want a real one:

- A competent freelance logo costs ₹3,000–15,000 (99designs, Fiverr, or a local
  designer).
- Ask for: SVG + PNG, light and dark versions, a square icon crop, and the
  colour codes.
- Keep the site's palette so nothing else needs redesigning:
  navy `#12224a`, marigold `#f2a93b`, teal `#12776e`, cream `#fbf8f3`.
- Replace `logo.svg`, `logo-mark-light.svg` and `favicon.svg`, then run
  `npm run og` to refresh the social share image.
