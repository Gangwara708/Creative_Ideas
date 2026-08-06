# 09 · Launch checklist

Print this. Tick every box before you announce the website anywhere.

---

## A. Content and truthfulness

- [ ] Business name is final and applied everywhere (`node tools/rebrand.mjs …`)
- [ ] Phone, WhatsApp and email in `site.config.json` are real and monitored
- [ ] Someone actually answers that phone during the stated working hours
- [ ] Office address is real (or the address block has been removed)
- [ ] Fees on `/pricing.html` are the fees you will actually charge
- [ ] "+ GST" text removed if you are not GST-registered
- [ ] Founder name, qualifications and photo are real — no placeholder text left
- [ ] **Sample testimonials replaced with consented real ones, or deleted**
- [ ] **Statistics (2,400+, 12+ years, 4.8/5) replaced with numbers you can evidence, or deleted**
- [ ] Yellow "Template notice" boxes removed from the four legal pages
- [ ] Legal pages reviewed by a lawyer or at least read line by line by the owner
- [ ] Grievance officer named in the privacy policy is a real person who reads that inbox
- [ ] No page promises an admission, seat, rank, visa or job anywhere

## B. Technical

- [ ] `npm run check` passes with zero errors
- [ ] Site deployed and reachable at the real domain
- [ ] `https://` works, and `http://` redirects to it
- [ ] One canonical host chosen (`www` or bare) and the other redirects to it
- [ ] `site.config.json` → `url` matches the live domain exactly
- [ ] Favicon appears in the browser tab
- [ ] `/sitemap.xml` and `/robots.txt` load and show the correct domain
- [ ] 404 page works (visit `/some-nonsense-url`)
- [ ] Social share preview looks right — test at opengraph.xyz or by pasting the link into WhatsApp
- [ ] Tested on a **real Android phone on mobile data**, not just a desktop browser
- [ ] Tested on iPhone Safari if possible
- [ ] Page speed: PageSpeed Insights mobile score above 90

## C. The conversion path (test it end to end, for real)

- [ ] Submit the contact form as if you were a client
- [ ] The enquiry actually arrives (email / dashboard / WhatsApp)
- [ ] The thank-you page appears after submission
- [ ] The WhatsApp floating button opens a chat with the right number and a pre-filled message
- [ ] The call button dials the right number from a phone
- [ ] All `mailto:` links open with the right address
- [ ] Form validation rejects a bad phone number
- [ ] Someone has agreed to respond to enquiries within one working day

## D. Business readiness

- [ ] Udyam / entity registration done
- [ ] Business current account open
- [ ] Payment method live (UPI QR or payment link) and tested with ₹1
- [ ] Invoice template ready with correct numbering
- [ ] Engagement letter / consent form drafted for minors
- [ ] Calendar / booking link set up and linked from the contact page
- [ ] CA engaged, even if only on a small retainer
- [ ] Professional indemnity insurance quoted (buy before the first big package)

## E. Marketing foundations

- [ ] Google Business Profile created and **verified**
- [ ] Google Search Console verified, sitemap submitted
- [ ] GA4 configured, or deliberately left off
- [ ] WhatsApp Business profile complete with catalogue
- [ ] Instagram and YouTube handles claimed with the logo as profile picture
- [ ] LinkedIn page created
- [ ] The three existing blog guides read once more for accuracy against this year's rules

## F. Safety and data

- [ ] Two-factor authentication on email, hosting and the leads dashboard
- [ ] Password manager in use; no shared passwords
- [ ] Admin token for the backend (if used) is long, random, and not in git
- [ ] Backups configured and **one restore tested**
- [ ] Tele-MANAS (14416) and two local mental-health referrals written down and reachable
- [ ] Data retention periods in the privacy policy diarised so they are actually enforced

---

## The five-minute pre-announcement test

Ask someone who has never seen the site — ideally a parent, not a developer — to
open it on their phone and answer these without help:

1. What does this business do?
2. Would it help someone in your situation?
3. What does it cost?
4. How would you contact them?
5. Do you trust them? Why or why not?

If any answer takes more than ten seconds, fix that before you spend a rupee on
marketing.

---

## Announcement day

1. WhatsApp status + personal message to 50 people who know you
2. Instagram post + story
3. LinkedIn post (this one brings the professional-track clients)
4. Message every school and coaching contact individually — not a broadcast
5. Ask five people to leave an honest Google review of their experience with you

Then go back to chapter [06](06-seo-and-marketing.md) and start the content
calendar. The website is the beginning of the work, not the end of it.
