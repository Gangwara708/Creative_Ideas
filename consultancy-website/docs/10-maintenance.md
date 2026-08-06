# 10 · Maintaining the site after launch

The site has no dependencies, no database and no framework, which means it will
not rot. There is nothing to patch and nothing that stops working when a package
is deprecated. What it needs is **content upkeep** and a few seasonal checks.

---

## 1. Who does what

| Task | Who | How often |
|---|---|---|
| Reply to enquiries | Owner / counsellor | Daily |
| Update fees | Owner (`site.config.json`) | As needed |
| New blog post | Owner or writer | Monthly |
| Verify exam/counselling facts in the guides | Owner | Before each season |
| Add real testimonials | Owner | As collected |
| Check the site loads and the form works | Anyone | Monthly |
| Renew domain | Owner | Annually (turn on auto-renew) |
| Review privacy policy and retention | Owner + advisor | Annually |
| Update fonts / OG image after a rebrand | Whoever edits | On rebrand |

---

## 2. Making a change — the whole workflow

```bash
cd consultancy-website

# 1. Edit — text lives in src/pages/, shared bits in src/partials/,
#    contact details and fees in site.config.json
# 2. Preview
npm run dev            # http://localhost:8080, rebuilds as you save

# 3. Verify
npm run check          # rebuilds and fails on broken links or missing metadata

# 4. Publish
git add -A && git commit -m "Update pricing" && git push
#    → Cloudflare Pages / Netlify / Vercel redeploy automatically
#    → or, on a VPS: ./deploy/deploy.sh deploy@server-ip
```

**Never edit `dist/`.** It is regenerated from `src/` on every build; changes
there are silently destroyed.

---

## 3. Adding a new page

1. Create `src/pages/your-page.html`.
2. Start it with the metadata block:

```html
<!--
{
  "id": "your-page",
  "title": "Page Title | Brand",
  "description": "One sentence, under 160 characters, that would make someone click."
}
-->
```

3. Write the body using the existing patterns (`.section`, `.container`,
   `.card`, `.grid--3` — copy from a similar page).
4. `npm run check`. The sitemap updates itself.
5. Link to it from somewhere — an unlinked page is invisible to visitors and to
   Google.

**To add a blog post:** create the file in `src/pages/blog/`, then add a card to
`src/pages/blog/index.html` and (optionally) the home page teaser.

**To add it to the top navigation:** edit `buildNav()` in `tools/build.mjs` —
one line, and the header, mobile menu and active-state all follow.

---

## 4. Seasonal accuracy review (important for this business)

The three guides describe processes that change every year. Before each season,
re-read and update against the current official notifications:

| Guide | Check before | What changes |
|---|---|---|
| NEET counselling guide | May | Round structure, fees, deposit rules, deadlines |
| Branch vs. college (JEE) | May | JoSAA/CSAB round counts, seat matrix, new institutes |
| Career switch after 30 | Annually | Salary bands, in-demand skills |

Then update the "Updated <date>" line on the page. An out-of-date guide with a
current date on it is worse than no guide.

---

## 5. Things that will need attention eventually

| When | What to do |
|---|---|
| You rebrand | `node tools/rebrand.mjs "New Name" "Short"` → `npm run og` → `npm run check` |
| You change the logo | Replace the three SVGs in `src/assets/img/`, run `npm run og` |
| You change fonts | Edit `--font-head` / `--font-body` in `style.css`, then `npm run fonts` |
| You add GST | Update `pricing.html` text and `site.config.json` → `legal.gstin` |
| You register a company | Update `legalName`, `legal.entityType`, `legal.cinOrUdyam` |
| You move hosts | Update `url` in `site.config.json` and resubmit the sitemap |
| Prices change | `site.config.json` → `pricing`, rebuild |

---

## 6. If something breaks

| Symptom | Likely cause | Fix |
|---|---|---|
| Build fails with "metadata is not valid JSON" | Missing comma or quote in a page's metadata block | Fix the JSON at the top of the named file |
| Build fails with "Missing partial" | Typo in a `{{> name }}` include | Check the filename in `src/partials/` |
| `npm run check` reports a broken link | A page was renamed or deleted | Update the link, or restore the page |
| Text shows `{{ site.something }}` on the live site | A config key was renamed or deleted | Restore the key in `site.config.json` |
| Contact form does nothing | `forms.endpoint` misconfigured | Clear it to fall back to WhatsApp, then fix the endpoint |
| Fonts look like Times New Roman | `assets/fonts/` did not upload | Redeploy; check `dist/assets/fonts/` exists on the server |
| Site loads but has no styling | `assets/css/` did not upload, or a wrong base path | Redeploy the whole `dist/` folder |

The build script prints the exact file and reason on failure. Read the message —
it is usually literal.

---

## 7. Handover notes for a future developer

- **Stack:** plain HTML/CSS/JS. A ~200-line Node build script assembles pages
  from `src/pages/` + `src/partials/` using a deliberately tiny template syntax
  (`{{ var }}`, `{{> partial }}`, `{{{ content }}}`). No dependencies, no
  lockfile, no framework upgrade treadmill.
- **Why:** the owner is not a developer. A Next.js site would be unmaintainable
  for them in eighteen months, and a WordPress install would need patching
  forever. This will still build with `node tools/build.mjs` in ten years.
- **The checker (`tools/check.mjs`) is the test suite.** It validates internal
  links, titles, descriptions, heading structure, alt text and leftover
  placeholders. Run it in CI if you add CI.
- **The backend is optional and isolated.** `backend/server.js` has zero
  dependencies and can be deleted without affecting the site.
- **Conventions:** one `<h1>` per page; sections use `.section` +
  `.container`; components are in the CSS's numbered sections; brand colours are
  CSS custom properties in `:root`.
