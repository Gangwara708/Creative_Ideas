# 08 · Running the business day to day

The website generates enquiries. This chapter is what happens after one arrives.

---

## 1. The enquiry-to-client pipeline

```
Enquiry (form / WhatsApp / call)
   └─> Same-day acknowledgement          (target: within 2 hours)
        └─> Discovery call, 15 min, free (target: within 1 working day)
             └─> Written recommendation + quote (same day)
                  └─> Payment + scheduling
                       └─> Assessment / homework
                            └─> Session(s)
                                 └─> Written plan delivered
                                      └─> Follow-up + review request
```

**The number that matters most is the first one.** In this market, response
speed beats reputation: a family that submits a form at 9 p.m. after a bad
result will call three consultants, and usually engages whoever calls back
first with something useful to say.

---

## 2. Tools, with free options

| Need | Free option | Paid upgrade | Notes |
|---|---|---|---|
| **Booking / calendar** | Google Calendar appointment schedule; Cal.com free tier | Calendly (~$10/mo) | Put the link on the contact page once set up |
| **Video calls** | Google Meet, Zoom free (40 min) | Zoom Pro | Meet has no time limit for 1:1 |
| **CRM** | A Google Sheet | Zoho CRM free (3 users), HubSpot free | Do not buy a CRM in month one — a sheet is fine to ~50 clients |
| **Lead capture** | This site's WhatsApp fallback; Web3Forms | The included backend | See [03](03-deployment.md) §5 |
| **Invoicing** | Zoho Invoice free | Vyapar, Refrens | [07](07-payments-and-gst.md) |
| **Documents / plans** | Google Docs → PDF | Notion, Canva | Use a consistent branded template |
| **Psychometrics** | Free interest inventories + structured interview | Licensed batteries (₹500–1,500/test) | See §4 |
| **E-signature** | Zoho Sign free tier | DocuSign | For engagement letters on bigger packages |
| **Password manager** | Bitwarden free | 1Password | Non-negotiable — you hold client data |
| **Backups** | Google Drive | Cloudflare R2 / Backblaze | [03](03-deployment.md) §4.6 |

**Total monthly software cost to start: ₹0.** Add tools when a specific pain
appears, not in anticipation of one.

---

## 3. A simple client tracker (start here, not with a CRM)

One sheet, these columns:

`Date | Name | Phone | Source | Student/Professional | Service | Status | Fee quoted | Fee paid | Next action | Next action date | Notes`

Statuses: `New → Contacted → Call done → Quoted → Paid → In progress → Delivered → Follow-up → Closed`

Filter on "Next action date ≤ today" every morning. That one habit is worth more
than any software.

If you deploy the included backend, `/admin` gives you the same data with a CSV
export — download it weekly into this sheet.

---

## 4. Assessments — what to actually use

Psychometrics are the credibility backbone of student counselling, and also
where the industry is sloppiest.

- **Do** use standardised, published instruments with documented reliability and
  validity, interpreted alongside academic records and an interview.
- **Do** tell families plainly that a test **informs** a decision; it does not
  make one. A report that outputs one "correct career" is selling certainty that
  does not exist.
- **Don't** use free internet quizzes and present them as scientific.
- **Don't** interpret clinical instruments unless you are qualified to.

Free/low-cost starting points: RIASEC/Holland-code interest inventories,
structured aptitude batteries from reputable Indian providers, and your own
well-designed interview protocol. Commercial batteries typically cost
₹500–1,500 per student — build that into the package price.

**Always take written parental consent before assessing a minor**, and state who
sees the results and for how long they are kept.

---

## 5. Session structure that works

**Discovery call (15 min, free)**
1. What is the situation, in your words? (listen for 5 minutes, don't sell)
2. What have you already decided or ruled out?
3. What is the deadline?
4. What is the budget reality?
5. Here is what we would do, what it costs, and whether I think it will help you.

**Main session (60–90 min)**
1. Recap and confirm the facts (5 min)
2. Assessment/data walkthrough — screen shared, sources visible (20 min)
3. Options generated together, not presented (25 min)
4. Trade-offs named out loud (15 min)
5. Decision or decision-criteria agreed (10 min)
6. Next steps and who does what (5 min)

**Deliverable (within 48 hours):** a 2–4 page PDF — situation, options
considered, recommendation, Plan B, timeline, checklist. This document is what
gets forwarded to relatives, and it is your best marketing asset.

---

## 6. Capacity and burnout

Counselling is emotionally heavy work, especially in result season when you will
speak with frightened families all day.

- Cap at **4–5 substantive sessions a day**, and fewer if any were difficult.
- Block admin time; do not let it eat evenings.
- Result season (May–August) will be 3× normal volume. Plan for it: raise prices
  in season, or cap intake, or hire help — but decide in March, not in June.
- Have someone to debrief with. Absorbing other people's anxiety without an
  outlet is how people leave this profession.

---

## 7. Hiring, when the time comes

First hires, in order of usual value:

1. **Part-time counsellor** for overflow in season
2. **Operations/admin assistant** — scheduling, follow-ups, invoices
   (frees the most billable hours per rupee)
3. **Content/social person** — only once the content engine is proven

For anyone touching client data: a written confidentiality undertaking, their
own login (never shared credentials), and access limited to what they need.
