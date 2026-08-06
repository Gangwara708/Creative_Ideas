# 00 · START HERE — the whole plan, A to Z

Yeh document poora roadmap hai: idea se lekar live website + registered business tak.
Baaki files isi ke chapters hain.

> **Ek baat pehle:** main ek engineer/consultant hoon, lawyer ya CA nahi. Legal aur
> tax steps yahan detail me hain aur India-specific hain, lekin **final filing se
> pehle ek CA ya company-secretary se 30 minute ki consultation zaroor le lijiye**
> (₹1,000–3,000 me ho jaata hai aur mahine bhar ki galtiyan bacha deta hai).
> Rules aur fees change hoti rehti hain — har number verify karein.

---

## The 6 tracks, and what depends on what

```
Track A  Business & legal setup ........ can start today, runs 1–3 weeks
Track B  Brand, domain, email .......... needs A's name decision
Track C  Website (DONE — in this repo) . needs B's content inputs
Track D  Payments & invoicing .......... needs A (bank a/c) + C (policy pages)
Track E  Deployment & hosting .......... needs B (domain) + C
Track F  Marketing & first clients ..... needs C + E live
```

**The critical path is A → B → E.** Everything else can run in parallel.
Website ka kaam 90% ho chuka hai — ab mostly aapke content aur decisions chahiye.

---

## Week-by-week plan

### Week 1 — Decisions and paperwork
| # | Task | Where | Cost (₹, indicative) |
|---|---|---|---|
| 1 | Final business name (3 options, check trademark + domain) | [02](02-brand-domain-email.md) | 0 |
| 2 | Choose entity type (proprietorship / LLP / Pvt Ltd) | [01](01-legal-company-registration.md) | 0 |
| 3 | Buy domain | [02](02-brand-domain-email.md) | 800–1,500/yr |
| 4 | Apply Udyam (MSME) registration — free, online, instant | [01](01-legal-company-registration.md) | 0 |
| 5 | Fill in `site.config.json` with real details | [04](04-content-checklist.md) | 0 |

### Week 2 — Identity and money
| # | Task | Where | Cost (₹) |
|---|---|---|---|
| 6 | Register the entity (if LLP/Pvt Ltd — starts now, takes 7–15 days) | [01](01-legal-company-registration.md) | 0–15,000 |
| 7 | Open current bank account | [01](01-legal-company-registration.md) | 0–10,000 min balance |
| 8 | Business email on your domain | [02](02-brand-domain-email.md) | 0–210/user/mo |
| 9 | Write real About/founder content + collect testimonials | [04](04-content-checklist.md) | 0 |
| 10 | Get legal pages reviewed by a lawyer | [05](05-compliance-and-risk.md) | 3,000–10,000 |

### Week 3 — Go live
| # | Task | Where | Cost (₹) |
|---|---|---|---|
| 11 | Deploy the website | [03](03-deployment.md) | 0 |
| 12 | Connect domain + SSL | [03](03-deployment.md) | 0 |
| 13 | Set up the contact form endpoint | [03](03-deployment.md) | 0 |
| 14 | Google Business Profile + Search Console + Analytics | [06](06-seo-and-marketing.md) | 0 |
| 15 | Payment gateway onboarding (needs the legal pages live) | [07](07-payments-and-gst.md) | 0 setup, ~2% per txn |

### Week 4 — First clients
| # | Task | Where |
|---|---|---|
| 16 | WhatsApp Business profile + catalogue | [06](06-seo-and-marketing.md) |
| 17 | 10 local school/college outreach emails | [06](06-seo-and-marketing.md) |
| 18 | First blog post published | [06](06-seo-and-marketing.md) |
| 19 | Booking/calendar tool live | [08](08-operations-and-tools.md) |
| 20 | Run the full pre-launch checklist | [09](09-launch-checklist.md) |

---

## What this costs to start

| Item | Bare minimum | Comfortable |
|---|---:|---:|
| Domain (1 yr) | ₹800 | ₹1,500 |
| Website hosting | ₹0 (Cloudflare Pages) | ₹0 |
| Business email | ₹0 (Zoho free tier) | ₹2,500/yr (Google Workspace) |
| Entity registration | ₹0 (proprietorship + free Udyam) | ₹8,000–15,000 (LLP/Pvt Ltd) |
| Legal review of policies | ₹0 (use as-is, risky) | ₹5,000–10,000 |
| Trademark (1 class) | ₹0 (skip initially) | ₹4,500 govt fee + ₹5,000 agent |
| Payment gateway | ₹0 setup | ₹0 setup |
| Psychometric tool licences | ₹0 (start manual) | ₹500–1,500 per assessment |
| **First-year total** | **≈ ₹1,000–2,000** | **≈ ₹30,000–45,000** |

Yes — you can genuinely be live and legal for under ₹2,000 in year one as a sole
proprietor on free hosting. Everything above that buys credibility and protection,
not capability.

**Recurring after that:** domain ₹1,000/yr, hosting ₹0 (or ₹6,000–10,000/yr if you
move to a VPS), email ₹0–2,500/yr, accounting ₹6,000–15,000/yr once GST applies.

---

## The website that ships in this repo

22 pages, already built and link-checked:

- Home, About, Services hub, Pricing, Contact, FAQ, Insights (blog) + 3 full guides
- 6 service pages: NEET · JEE/IIT · Class 9–12 · Jobs & career switch · Study abroad · Life clarity coaching
- 4 legal pages: Privacy · Terms · Refund · Disclaimer
- Thank-you page and a 404 page
- Lead form with validation, spam trap, and a WhatsApp fallback so **no enquiry is ever lost even before you set up a backend**
- Self-hosted fonts, sitemap, robots.txt, structured data, social share image
- Optional Node backend that stores enquiries on your own server with an admin dashboard

Run it locally right now:

```bash
cd consultancy-website
npm run dev      # → http://localhost:8080
```

No `npm install` needed — there are zero dependencies.

---

## Read next

| File | What's in it |
|---|---|
| [01-legal-company-registration.md](01-legal-company-registration.md) | Entity choice, registration steps, GST, licences, what you must NOT claim |
| [02-brand-domain-email.md](02-brand-domain-email.md) | Naming, trademark check, domain, professional email |
| [03-deployment.md](03-deployment.md) | Which cloud, why, and exact commands for each option |
| [04-content-checklist.md](04-content-checklist.md) | Every piece of text/photo the client must supply |
| [05-compliance-and-risk.md](05-compliance-and-risk.md) | Advertising rules, minors' data, disclaimers, insurance |
| [06-seo-and-marketing.md](06-seo-and-marketing.md) | Google Business Profile, local SEO, content calendar, ads |
| [07-payments-and-gst.md](07-payments-and-gst.md) | Gateway onboarding, invoicing, GST, income tax |
| [08-operations-and-tools.md](08-operations-and-tools.md) | Booking, CRM, video calls, assessments, pricing strategy |
| [09-launch-checklist.md](09-launch-checklist.md) | The final tick-list before you announce |
| [10-maintenance.md](10-maintenance.md) | Who updates what, and how often |
