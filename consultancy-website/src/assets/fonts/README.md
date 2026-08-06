# Self-hosted web fonts

These `.woff2` files are downloaded from Google Fonts by `tools/fetch-fonts.mjs`
and served from this site's own domain.

## Why self-hosted

- A pending third-party stylesheet **blocks script execution**, which delayed
  the contact form's JavaScript on slow connections. Self-hosting removed that.
- No third-party origin receives visitors' IP addresses — relevant under the
  DPDP Act, especially since many visitors are minors.
- Fewer DNS and TLS round trips on mobile networks.
- The Content-Security-Policy can drop `fonts.googleapis.com` and
  `fonts.gstatic.com` entirely.

## What's here

| Family | Weights | Subsets | Used for |
|---|---|---|---|
| Fraunces | 600 | latin, latin-ext | Headings, logo, statistics |
| Plus Jakarta Sans | 400, 500, 600, 700 | latin, latin-ext | Body text, UI |

`latin-ext` is included because the Indian Rupee sign (₹, U+20B9) lives in that
subset, not in `latin`.

Total: ~280 KB, cached for a year by the `_headers` rules.

## Licence

Both families are licensed under the **SIL Open Font License, Version 1.1**,
which explicitly permits redistribution and web embedding.

- Fraunces — Copyright The Fraunces Project Authors
  (https://github.com/undercasetype/Fraunces)
- Plus Jakarta Sans — Copyright The Plus Jakarta Sans Project Authors
  (https://github.com/tokotype/PlusJakartaSans)

Full licence text: https://openfontlicense.org/ — keep a copy of `OFL.txt` from
each project's repository alongside these files if you want the letter of the
licence covered.

## Regenerating

```bash
npm run fonts     # re-downloads and rewrites assets/css/fonts.css
```

Only needed if you change the font families in `src/assets/css/style.css`.
