# 03 · Deployment — which cloud, and exactly how

**Short answer: you do not need to rent a server.**

This website is static HTML, CSS and JS. It has no database and no runtime.
That means it can be served from a global CDN for **free**, faster than any
₹800/month VPS in Mumbai would serve it, with automatic HTTPS and no server to
patch, secure or back up.

Rent a server only when one of these becomes true:

- you want enquiries stored **on your own infrastructure** rather than a form
  service (and even then, a free-tier serverless function usually suffices);
- you add something genuinely dynamic — logins, dashboards, a booking engine
  you build yourself, payments handled server-side;
- a client contract requires data residency on infrastructure you control.

Section 4 covers the VPS route in full, because you asked — but read section 1
first and be honest about whether you need it yet.

---

## 1. The options compared

| | Cloudflare Pages | Netlify | Vercel | GitHub Pages | VPS (Hostinger/DO) |
|---|---|---|---|---|---|
| Cost | **Free** | Free tier | Free tier | **Free** | ₹350–900/mo |
| Bandwidth | **Unlimited** | 100 GB/mo | 100 GB/mo | Soft 100 GB | Plan-limited |
| India speed | **Excellent** (Mumbai, Delhi, Chennai, Bengaluru, Hyderabad PoPs) | Good | Good | Fair | Good if Mumbai region |
| HTTPS | Auto, free | Auto, free | Auto, free | Auto, free | You run Certbot |
| Custom domain | Free | Free | Free | Free | Yours |
| Deploy on git push | Yes | Yes | Yes | Yes | Script/CI |
| Rollback | One click | One click | One click | Via git | Manual |
| Server maintenance | **None** | None | None | None | **Yours: patches, backups, uptime** |
| Form handling | Workers / 3rd party | **Built-in forms** | 3rd party | 3rd party | Your own API |
| Best for | **This project** | Non-technical owner who wants built-in forms | Teams already on Vercel | Simplest possible | Full control |

### Recommendation

1. **Cloudflare Pages** — best free tier, best India latency, unlimited
   bandwidth. This is the default choice.
2. **Netlify** — pick this instead if the owner wants **built-in form handling**
   with zero configuration and an email on every enquiry. Slightly lower free
   limits, meaningfully less setup.
3. **VPS** — only when section 4's triggers apply.

---

## 2. Deploy to Cloudflare Pages (recommended, ~15 minutes)

### 2a. Via the dashboard (no command line)

1. Push this repository to GitHub.
2. Sign up at **dash.cloudflare.com** → **Workers & Pages** → **Create** →
   **Pages** → **Connect to Git**.
3. Pick the repository, then set:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `consultancy-website`
   - **Environment variable:** `NODE_VERSION` = `20`
4. **Save and Deploy.** You get a live URL like
   `your-project.pages.dev` in about a minute.
5. **Custom domains** → add `www.yourbrand.com` and `yourbrand.com`.
   If your domain's nameservers are already on Cloudflare, DNS is automatic;
   otherwise add the CNAME they show you at your registrar.
6. SSL is issued automatically. Set **SSL/TLS → Full (strict)** and turn on
   **Always Use HTTPS**.

Every `git push` to the main branch now redeploys the site. Pull requests get
their own preview URL.

### 2b. Via the command line

```bash
cd consultancy-website
npm run build
npx wrangler pages deploy dist --project-name=disha-consultancy
```

### The `_headers` file

`src/static/_headers` (copied into `dist/` at build time) sets the security
headers and cache policy. Cloudflare Pages and Netlify both read it
automatically — nothing else to configure.

---

## 3. The alternatives, briefly

### Netlify
Connect the repo, set base directory `consultancy-website`, build `npm run build`,
publish `dist`. `netlify.toml` in this repo already declares all of that.
**Its built-in Forms feature is the reason to choose Netlify:** add
`netlify` and `netlify-honeypot="website"` attributes to the form tag in
`src/partials/lead-form.html`, rebuild, and enquiries appear in the Netlify
dashboard with email notifications, free for the first 100 submissions/month.

### Vercel
Import the repo, root directory `consultancy-website`. `vercel.json` already
sets the build, `cleanUrls` and the security headers.

### GitHub Pages
Simplest but weakest: no header control, so the CSP and caching rules in
`_headers` are ignored. Fine for a temporary preview, not ideal for launch.

### Static hosting on shared cPanel hosting (Hostinger, GoDaddy)
If the client already pays for shared hosting: run `npm run build` locally and
upload the **contents of `dist/`** to `public_html` via FTP or the file manager.
It works, but you lose git-based deploys and rollbacks.

---

## 4. The VPS route — full instructions

Choose this if you need the lead API on your own box, or you simply want the
control. Everything below is tested against Ubuntu 22.04/24.04.

### 4.1 Which provider and which region

**Always choose an India region** (Mumbai/Delhi/Bengaluru/Hyderabad) — it is the
difference between ~30 ms and ~250 ms for your visitors.

| Provider | Entry plan | Price/mo | India region | Notes |
|---|---|---|---|---|
| **Hostinger VPS** | 1 vCPU, 4 GB | ₹400–800 | Mumbai | Cheapest credible option in India, rupee billing |
| **DigitalOcean** | 1 vCPU, 1 GB | $6 (~₹520) | Bengaluru | Best docs, simplest UI |
| **AWS Lightsail** | 1 vCPU, 1 GB | $5–7 | Mumbai | Easy path into the wider AWS ecosystem later |
| **Amazon EC2 t4g.small** | 2 vCPU, 2 GB | ~$12 | Mumbai | Only if you need real AWS |
| **Azure B1s** | 1 vCPU, 1 GB | ~$8–10 | Central India (Pune) | If the client is a Microsoft shop |
| **Google Cloud e2-micro** | shared | ~$7 | Mumbai | Fine, but fiddlier billing |
| **Oracle Cloud Always Free** | 1 GB (x86) or 4 ARM cores/24 GB | **₹0** | Mumbai/Hyderabad | Genuinely free forever; capacity can be hard to get and support is thin |
| **AWS/Azure free tier** | 12 months | ₹0 then paid | Mumbai | Watch the cliff at month 13 |

**Recommendation if you must have a VPS:** Hostinger VPS Mumbai for rupee
billing and price, or DigitalOcean Bengaluru for the better documentation. A
1 GB box handles this site and thousands of daily visitors comfortably.

Also budget: **backups** (usually ~20% of plan cost — take them) and a **domain**.

### 4.2 First-time server setup

```bash
# ---- on your machine ----
ssh root@YOUR_SERVER_IP

# ---- on the server ----
adduser deploy && usermod -aG sudo deploy      # don't run as root
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy/
apt update && apt upgrade -y
apt install -y nginx git curl ufw fail2ban

# Node 20 (only needed if you build on the server or run the lead API)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs

# Firewall: SSH + web only
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable

# fail2ban blocks repeated SSH brute-force attempts
systemctl enable --now fail2ban
```

**Harden SSH** — in `/etc/ssh/sshd_config` set `PermitRootLogin no` and
`PasswordAuthentication no` (make sure your key works first!), then
`systemctl restart ssh`.

### 4.3 Put the site on it

```bash
sudo mkdir -p /var/www/consultancy
sudo chown -R deploy:deploy /var/www/consultancy

# From your own machine:
cd consultancy-website
npm run build
rsync -avz --delete dist/ deploy@YOUR_SERVER_IP:/var/www/consultancy/dist/
```

### 4.4 Nginx + HTTPS

```bash
# On the server — deploy/nginx.conf from this repo, with your domain filled in
sudo cp /path/to/nginx.conf /etc/nginx/sites-available/consultancy
sudo ln -s /etc/nginx/sites-available/consultancy /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Free TLS certificate, auto-renewing
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourbrand.com -d www.yourbrand.com
sudo systemctl status certbot.timer      # confirms auto-renewal is armed
```

Point your domain's **A record** (and `www` A or CNAME) at the server's IP
before running Certbot, or validation fails.

### 4.5 The lead API (optional)

```bash
sudo mkdir -p /etc/consultancy /var/lib/consultancy
sudo chown www-data:www-data /var/lib/consultancy
printf 'ADMIN_TOKEN=%s\n' "$(openssl rand -hex 24)" | sudo tee /etc/consultancy/api.env
sudo chmod 600 /etc/consultancy/api.env

sudo cp deploy/consultancy-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now consultancy-api
sudo systemctl status consultancy-api
```

Then set `"forms": { "endpoint": "/api/lead" }` in `site.config.json`, rebuild,
redeploy. Enquiries land in `/var/lib/consultancy/leads.jsonl` and are readable
at `https://yourbrand.com/admin` with the admin token.

**Restrict `/admin`** — uncomment the `allow`/`deny` lines in `deploy/nginx.conf`
with your own IP, or drop the block entirely and reach it through an SSH tunnel:

```bash
ssh -L 8080:127.0.0.1:3000 deploy@YOUR_SERVER_IP   # then open localhost:8080/admin
```

### 4.6 Back it up

The leads file **is** your business. Nightly off-server copy:

```bash
# On the server, in `crontab -e`
0 2 * * * tar czf /tmp/leads-$(date +\%F).tar.gz /var/lib/consultancy && \
          rclone copy /tmp/leads-$(date +\%F).tar.gz remote:consultancy-backups
```

Any object store works (Cloudflare R2 has a generous free tier, Backblaze B2 is
cheap, S3 is fine). **Test a restore once** — an untested backup is a rumour.

### 4.7 Routine deploys after that

```bash
./deploy/deploy.sh deploy@YOUR_SERVER_IP
```

It builds, runs the link checker, refuses to upload if anything is broken,
rsyncs, and reloads Nginx.

---

## 5. Wiring up the contact form

The form works on day one **without any backend**: with no endpoint configured
it opens WhatsApp pre-filled with the enquiry, so nothing is ever lost. When you
want proper capture, pick one:

| Option | Cost | Setup | Where enquiries land |
|---|---|---|---|
| **Web3Forms** | Free (250/mo) | Paste your access key as the endpoint | Your email |
| **Formspree** | Free (50/mo) | Same | Dashboard + email |
| **Netlify Forms** | Free (100/mo) | Add two attributes to the form | Netlify dashboard |
| **Google Forms/Sheets** | Free | Apps Script web app URL | A spreadsheet |
| **This repo's backend** | Server cost | §4.5 | Your own server + `/admin` |

For Web3Forms or Formspree, set the URL in `site.config.json`:

```json
"forms": { "endpoint": "https://api.web3forms.com/submit", "successPage": "thank-you.html" }
```

Web3Forms also needs the access key sent in the body — add it as a hidden input
in `src/partials/lead-form.html`:

```html
<input type="hidden" name="access_key" value="YOUR-ACCESS-KEY">
```

Then rebuild and **submit a real test enquiry** before you announce the site.

---

## 6. After deploying — do these five things

1. Open the site on a **real phone on mobile data**, not just your laptop.
2. Submit the contact form and confirm the enquiry actually arrives.
3. Click **every** link in the footer (or just run `npm run check`).
4. Submit `https://yourbrand.com/sitemap.xml` in **Google Search Console**.
5. Run **PageSpeed Insights** on the live URL and keep mobile above 90.

---

## 7. Cost summary

| Setup | Year 1 | Year 2+ |
|---|---:|---:|
| Cloudflare Pages + domain + Zoho free email | **₹1,000** | **₹1,200** |
| Netlify + domain + Google Workspace (1 user) | ₹3,500 | ₹3,800 |
| VPS (Hostinger Mumbai) + domain + email + backups | ₹8,000–12,000 | ₹8,000–12,000 |

The free option is not the "cheap compromise" here — for a static marketing
site it is genuinely the faster and more reliable choice.
