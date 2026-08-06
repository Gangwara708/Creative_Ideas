# 07 · Taking payments, invoicing and GST

> Same disclaimer as chapter 01: verify rates, thresholds and onboarding
> requirements with your CA and the provider's current documentation.

---

## 1. How the client will actually pay you

| Method | Cost to you | Setup | Use it for |
|---|---|---|---|
| **UPI (personal-to-business VPA)** | ₹0 | Same day | Small sessions, local clients |
| **Bank transfer / NEFT** | ₹0 | Already have it | Larger packages, corporate |
| **Razorpay / Cashfree / PhonePe payment link** | ~2% + GST | 2–7 days KYC | Cards, netbanking, EMI, professional look |
| **Razorpay Payment Pages** | Same | Same | A hosted checkout page you can link from the site |
| **Cash** | ₹0 | — | In-person only, always with a receipt |

**Recommendation for month one:** a UPI QR on your business current account plus
a bank transfer option. Add a payment gateway when volumes justify the 2%.

**Important:** collect into a **business current account**, never a personal one.
The website says so in the contact and disclaimer pages, and it is also what
keeps your bookkeeping (and any future audit) sane.

---

## 2. Payment gateway onboarding — what they check

Razorpay, Cashfree, PhonePe and Stripe India all check the **website** before
approving a merchant account. This is a common source of week-long delays, and
this site already satisfies it:

| Requirement | Status here |
|---|---|
| Live, publicly accessible website | ✅ once deployed |
| Clear description of services | ✅ services pages |
| **Pricing visible** | ✅ `/pricing.html` |
| **Terms & conditions** page | ✅ `/legal/terms.html` |
| **Privacy policy** page | ✅ `/legal/privacy-policy.html` |
| **Refund & cancellation policy** page | ✅ `/legal/refund-policy.html` |
| Contact details: phone, email, address | ✅ footer + `/contact.html` |
| Business name matching the bank account | ⚠️ set `legalName` in `site.config.json` |
| HTTPS | ✅ automatic on all recommended hosts |

**Documents they will ask for:** PAN (business or proprietor), bank account
proof (cancelled cheque or statement), address proof, GST certificate if
registered, and the entity's registration document (Udyam works for a
proprietorship).

Typical approval: 2–7 working days. Apply **the week you deploy**, not the week
you need to take money.

---

## 3. Invoicing

Issue an invoice for **every** payment, including cash and UPI. A compliant
invoice contains:

- Your business name, address and (if registered) GSTIN
- Invoice number — sequential, no gaps, restarting each financial year
- Date
- Client name and address (and their GSTIN if it's a B2B sale)
- Description of the service and the SAC code
- Amount, tax rate, tax amount, total
- Place of supply (state) — this decides CGST+SGST vs. IGST
- Payment terms

**Tools:** Zoho Invoice (free for small volumes), Vyapar, Refrens, or
myBillBook. Do not build spreadsheets by hand — you will renumber something and
regret it during an audit.

---

## 4. GST in practice

Covered in detail in [01-legal-company-registration.md](01-legal-company-registration.md) §4.
The operational summary:

- **Under ₹20 lakh turnover (₹10 lakh in special-category states):** registration
  is optional. Stay unregistered while small; your prices stay 18% lower for
  families paying out of pocket.
- **Once registered:** charge 18%, show it separately on every invoice, file
  GSTR-1 and GSTR-3B on time, and claim input credit on business expenses
  (software, rent, internet, professional fees).
- **Pricing decision:** decide whether your published fee is **inclusive** or
  **exclusive** of GST and say so on the pricing page. The site currently shows
  "+ GST" — delete that text everywhere if you are not registered, or you will
  be quoting a tax you cannot legally collect.
- **NRI/overseas clients:** export of services is zero-rated. File a **LUT** at
  the start of the financial year to avoid paying IGST upfront, and retain proof
  of foreign inward remittance.

---

## 5. Bookkeeping that takes ten minutes a week

1. One business bank account. Everything in, everything out.
2. A folder per financial year: invoices out, bills in, bank statements.
3. Weekly: reconcile the week's payments against invoices raised.
4. Monthly: send the folder to your CA (₹1,000–2,000/month for a small practice).
5. Quarterly: check Form 26AS / AIS for TDS deducted by corporate clients.

Expenses you can legitimately claim: laptop, phone and internet (business
proportion), software subscriptions, assessment licences, office rent,
professional fees, marketing spend, travel for client work, professional
indemnity insurance.

---

## 6. Pricing strategy (the business question behind the numbers)

The placeholder fees in `site.config.json` are ₹1,500 per session, ₹4,999 for
the student pack and ₹14,999 for admission-season support. Set your real numbers
by working backwards:

```
Target monthly income          ₹60,000
÷ realistic billable sessions   20/month  (counselling is intense; 20 is a full load)
= required average fee          ₹3,000 per session
```

Then sanity-check against the market: independent career counselling in India
generally runs **₹1,000–3,000** for a single session, **₹4,000–15,000** for an
assessment + counselling package, and **₹10,000–50,000** for full
admission-season support. Study-abroad packages go much higher — and are exactly
where the commission-driven players operate, which is why your
"we take no commission" position is worth charging for.

**Three pricing principles for this business:**

1. **Never compete on being cheapest.** The cheapest counsellor signals the
   least experienced one, in a decision worth lakhs.
2. **Charge for the analysis, not the hour.** The written plan is the product.
3. **Keep the free discovery call genuinely free and genuinely honest.** It is
   your best sales asset precisely because it sometimes ends in "you don't need
   us".

Keep a small number of **subsidised places** each month for students who
genuinely cannot pay. The site already mentions this on the pricing page — it's
good practice, and in a referral market it comes back.
