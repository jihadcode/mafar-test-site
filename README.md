# MAFAR-LDS Portal — Beginner Setup Guide

This is a small website with:
- A public homepage (like bangsamoro.gov.ph, but simplified)
- A **Register** page and **Log In** page
- A protected **Dashboard** with the Client Registry and Programs screens from your screenshots

No prior coding experience needed — just follow the steps below in order.

---

## 1. Install Node.js (one-time setup)

Node.js is the free program that runs this website on your computer.

1. Go to **https://nodejs.org**
2. Download the version that says **LTS** (Long-Term Support)
3. Run the installer and click "Next" through all the default options
4. Restart your computer if it asks you to

To check it worked, open:
- **Windows:** Command Prompt (search "cmd" in the Start menu)
- **Mac:** Terminal (search "Terminal" in Spotlight)

Type this and press Enter:
```
node -v
```
If you see something like `v20.11.0`, you're good to go.

---

## 2. Get the project files onto your computer

Unzip the `mafar-lds-portal` folder you downloaded to somewhere easy to find,
like your Desktop.

---

## 3. Open a terminal inside the project folder

- **Windows:** Open the `mafar-lds-portal` folder in File Explorer, click the
  address bar, type `cmd`, and press Enter.
- **Mac:** Open Terminal, type `cd ` (with a space after), drag the
  `mafar-lds-portal` folder into the Terminal window, and press Enter.

---

## 4. Install the website's building blocks

In that terminal, type:
```
npm install
```
Press Enter and wait. This downloads three small helper packages
(Express, express-session, bcryptjs) that the website needs. You need an
internet connection for this one step only.

---

## 5. Start the website

For everyday use, type:
```
npm start
```

**While actively editing code**, you can instead use:
```
npm run dev
```
This uses a tool called `nodemon`, which automatically restarts the server
every time you save a `.js` file — so you don't have to stop (`Ctrl + C`) and
retype `npm start` after every change. Either way you'll see:
```
MAFAR-LDS Portal is running!
Open this in your browser:  http://localhost:3000
```

---

## 6. Open it in your browser

Go to **http://localhost:3000** in Chrome, Edge, or any browser.

- Click **"Create a Staff Account"** to register (the first account you create
  becomes the admin account). You'll also set a **Position / Job Title**
  (e.g. "Information Officer I") — this shows in the sidebar profile footer.
- After registering, you'll be taken straight to the **Dashboard**, with a
  sidebar matching your screenshot:
  - **Overview → Dashboard** — summary cards (total clients, active programs,
    ongoing projects, total project budget) plus breakdown charts.
  - **Registry → Clients** — the Client Registry table (Add/Edit/Delete, tabs,
    search) from your first sample.
  - **Registry → Programs** — the Programs table (Add/Edit/Delete) from your
    second sample.
  - **Registry → Projects** — individual projects, each linked to a Program
    via a dropdown, with budget, beneficiaries, dates, and status.
  - **Content → News & Announcements** — admin-only. Write posts that appear
    in the "News and Information" section of the public homepage. Each post
    has:
    - A **Category** (News, Updates, Radio Program, InfoGraphic Videos,
      Trivia, Audio-Video Presentation, Publications, IEC Materials, or
      Annual Reports) — matches the tab bar shown on the homepage.
    - A **Published**/**Draft** status (Draft posts stay hidden from the
      public and only show up here in the dashboard).
    - Optional **YouTube Video URL** and **Facebook Post/Video URL** fields.
      Fill in a YouTube link and it's embedded as a playable video on the
      homepage card automatically; fill in a Facebook link and a "View on
      Facebook" button appears. Leave both blank for a plain text post.
  - **Output → Reports** — sector totals and one-click **CSV export** buttons
    for Clients, Programs, and Projects (opens/downloads a spreadsheet file).
  - **Administration → Manage Users** — visible only to admin accounts (the
    first account you register). Lets you view every staff account, edit
    someone's full name/position/role, remove an account, or **reset their
    password directly** (see "Forgot Password" below).
- Next time, use **Log In** with the username/password you created.

### Forgot Password
There are two ways to recover a lost password:

1. **Self-service, from the Log In page** — click "Forgot your password?",
   enter your username or email, and a one-time reset link is generated.
   If you've set up real email (see below), it arrives in their inbox. If
   you haven't yet, it's printed to the terminal where you ran `npm start`
   instead (clearly labeled `=== EMAIL NOT SENT (SMTP not configured yet)
   ===`), so this still works out of the box during development. The link
   expires after 1 hour and can only be used once.

2. **Admin-assisted, from the dashboard** — an admin can open
   Manage Users and click **Reset Password** next to anyone's name to set a
   new password for them directly, no email step needed at all. This is the
   simplest option for a small team, and works whether or not email is set up.

Either way, passwords are always re-hashed with bcrypt before saving — the
new password is never stored as plain text, and a reset token can't be
reused once it's been used.

### Sending real emails (do this before you launch)
By default, no real emails go out — reset links just print to the server
console. Before you launch this website for real, you'll want actual emails
to be sent. Here's how, in three steps:

**Step 1 — Choose an email provider and get SMTP credentials**

| Option | Best for | Cost |
|---|---|---|
| **Gmail** (with an "App Password") | Quick testing, very small volume | Free |
| **Brevo** (formerly Sendinblue) | Small organizations going live for real | Free tier: 300 emails/day |
| **Resend** | Developers who want a modern, simple API | Free tier: 100 emails/day |

*Gmail setup:* Turn on 2-Step Verification on the Google account you'll send
from (Google Account → Security), then go to Google Account → Security →
**App Passwords**, create one for "Mail", and copy the 16-character password
it gives you. Use these settings:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=the-16-character-app-password
SMTP_FROM=MAFAR-LDS Portal <your-gmail-address@gmail.com>
```

*Brevo setup:* Create a free account at brevo.com, go to **SMTP & API** in
your account settings, and copy your SMTP login + SMTP key. Use:
```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-login-email
SMTP_PASS=your-brevo-smtp-key
SMTP_FROM=MAFAR-LDS Portal <no-reply@yourdomain.com>
```

**Step 2 — Create your `.env` file**

Copy `.env.example` to a new file named `.env` in the same folder, and fill
in the SMTP values from Step 1:
```
cp .env.example .env
```
Then open `.env` in a text editor and paste in your values. This file is
listed in `.gitignore`, so it's never accidentally uploaded anywhere.

**Step 3 — Restart the server**

Stop the server (`Ctrl + C`) and run `npm start` again. That's it — no code
changes needed. Test it by using "Forgot your password?" on the login page;
if you see `Email sent to ...` in the terminal instead of `EMAIL NOT SENT`,
it worked.

**A note on deliverability:** a brand-new Gmail/Brevo/Resend sender can
sometimes land in Spam at first, especially for a brand-new domain. For a
government or organizational launch, using your own domain's email (e.g.
`no-reply@yourministry.gov.ph` through Brevo or a similar service, with
SPF/DKIM records set up per their instructions) will deliver more reliably
than a personal Gmail address.

**Also set these two before launch, regardless of email:**
- `SESSION_SECRET` in `.env` — a long random string (the file explains how
  to generate one). Without this, login sessions use a fallback value that
  is NOT safe for a real, public launch.
- `NODE_ENV=production` in `.env` — once your site is actually running behind
  HTTPS (see your hosting provider's docs), this makes login cookies
  HTTPS-only.

### The full public site structure (mega-menu navigation)
Every public page now shares one navigation bar (`public/js/navbar.js` +
`public/css/navbar.css`) — a green banner with the MAFAR seal, and a full
dropdown menu matching MAFAR's actual site structure. **This is the one
deliberate exception to the "one CSS/JS file per page" rule** used
everywhere else in this project: since the navbar must look and behave
identically on every page, it lives in exactly one shared place. That also
means if you ever want to change or "undo" just the navigation (without
touching any page's own content), `navbar.js` and `navbar.css` are the only
two files you need to touch.

The menu, and where each item leads:

| Nav item | Sub-items | Where it lives |
|---|---|---|
| Home | — | `index.html` |
| About Us | Vision/Mission/Mandate, Organizational Structure, MAFAR Official Logo | `about.html` (scroll sections) |
| Officials | Minister's Corner, Regional Officials, Directory of Officials (live staff list) — plus the original Chief Minister/Key Officials/Parliament tabs | `officials.html` (6 tabs total) |
| News | Regional, Provincial, Philippine Rural Development Project, Mindanao Inclusive Agriculture Development Project, Special Development Fund, Bangsamoro Agriculture and Fisheries Training Institute | `news.html` (admin-manageable, 6 tabs) |
| Flagship Programs | BInHI, LUPA, ISDA | `programs.html` (scroll sections) |
| Transparency | Transparency Seal, Citizen's Charter, Procurement, Vacant Position | `transparency.html` (2 static + 2 admin-manageable tabs) |
| Issuances | Memorandum Orders, Administrative Orders | `issuances.html` (admin-manageable) |
| Knowledge Corner | Pull Quotes, Updates, InfoGraphic Videos, Trivia, Audio-Video Presentation, Radio Program, Publications, IEC Materials, Annual Reports, Project Papers | `knowledge-corner.html` (its own page, admin-manageable, 10 tabs) |
| Downloads | (flat list) | `downloads.html` (admin-manageable) |
| FAQs | — | `faqs.html` (admin-manageable) |
| Contact Us | — | `contact.html` (emails you via the same mailer as Forgot Password) |
| Search icon | — | `search.html` (searches News + Knowledge Corner + FAQs) |

**Important content note:** "News" and "Knowledge Corner" are two separate,
independently-managed lists under the hood, both powered by the same News
system in the dashboard — when adding a post there, you pick a **Section**
(News or Knowledge Corner) first, which determines which 6 or 10 categories
you can then choose from.

**Verified vs. illustrative content:** Where this project states specific
facts about real government structures (BInHI/LUPA/ISDA's actual program
components, the current MAFAR Minister's name, BARMM's transition-period
leadership), those were checked against live sources at the time of writing
— see the in-page notes and links to official sites for anything that
changes over time. Content clearly marked as a placeholder (e.g., the
Vision/Mission/Mandate wording, the Organizational Structure chart, contact
details) is illustrative and should be replaced with your office's real
information — those sections are plain static HTML in `about.html` and
`contact.html`, so you (or any future edit) can update them directly.

### Managing all this new content from the dashboard
Three dashboard sections under **Content** now cover everything above:
- **News & Announcements** — powers both the News page and the homepage's
  Knowledge Corner tabs (pick a Section, then a Category).
- **Issuances & Downloads** — one shared admin screen (with a section
  switcher) that also powers Transparency's Procurement/Vacant Position
  lists, since all three are just "a list of documents" under the hood.
- **FAQs** — simple question/answer pairs shown on the FAQs page.

### The homepage is a landing/overview page, not a content page
Earlier, the homepage's "Knowledge Corner" section was the exact same
10-tab experience as the dedicated page — visitors couldn't tell Home apart
from Knowledge Corner. That's been split apart on purpose:

- **Knowledge Corner now lives entirely on its own page**
  (`knowledge-corner.html`), with the full 10-tab experience, admin-managed
  from the same dashboard screen as before. Clicking a tab filters to that
  category; a category with no posts yet shows a friendly "nothing posted
  yet" message instead of looking broken.
- **The homepage (`index.html`) is now a proper overview/landing page**:
  - A **"Leadership" slideshow** right below the hero — a simple, dependency-free
    image carousel (no external library) featuring MAFAR-LDS/BARMM leadership
    photos with name and title captions, in a fixed display order. It
    auto-advances every 6 seconds, pauses while your mouse is over it, and
    has both arrow buttons and dot indicators. To change who's featured or
    the order they appear in, edit the `<div class="slide">` blocks in
    `public/index.html` (each one is just a photo + a name + a title) —
    photos live in `public/images/officials/`.
  - A short "Welcome to MAFAR-LDS" introduction with a link to the full
    About page, next to a small stats panel (total registered clients,
    municipalities covered, programs, ongoing projects) pulled from a
    public-safe summary endpoint (`/api/reports/public-summary` — only
    aggregate counts, never individual client records).
  - An "Explore the Site" grid of cards linking to every major section
    (About Us, Officials, Programs, News, Knowledge Corner, Transparency,
    Downloads, FAQs), so a first-time visitor immediately sees everything
    the site offers.
  - A compact "Latest Updates" preview — just the 3 most recent Knowledge
    Corner posts, no tabs — with a "View All" link to the full page.
- **Programs and About are their own separate pages** (`programs.html` and
  `about.html`), not scroll-to sections on the homepage — matching how the
  Officials page already worked.
- **Officials** — with three tabs specific to MAFAR (Minister's Corner,
  Regional Officials, Directory of Officials) plus the original three
  BARMM-wide tabs (Chief Minister, Key Officials, Parliament). Because
  BARMM's leadership is in an interim/transition period ahead of its first
  regular parliamentary election (set for September 2026), the Parliament
  tab is written as a general reference with a link to the official
  Bangsamoro Government page, rather than a full roster that would quickly
  go out of date.
- **Footer** — a dark BARMM-style footer with the regional seal and columns
  of Ministry/Agency links, matching the reference screenshot. Ministry links
  use the BARMM government's confirmed subdomain pattern
  (`{abbreviation}.bangsamoro.gov.ph`); Agency links currently point to the
  main `bangsamoro.gov.ph` portal since individual agency subdomains weren't
  independently confirmed — update `public/index.html`'s footer section with
  specific agency URLs if/when you have them.

### Mobile / small-screen behavior
On phones and narrow browser windows, the dashboard's sidebar collapses into
a hamburger (&#9776;) menu at the top of the screen instead of stacking all
its links above your content. Tap it to slide the menu in, tap the darkened
background (or any menu link) to close it. The public pages (homepage,
login, register, officials) reflow their navigation, buttons, and footer
into a single column below about 600px wide.

### About the color theme
The site's palette is drawn from the official BARMM flag and seal: deep
green (Islamic teachings and principles), golden-yellow (the crescent and
star, "a bright future"), and white (peace). Red is used sparingly, only for
delete/danger actions, echoing its meaning on the flag rather than being a
loud, everyday color. Every page also has a thin green "brand ribbon" bar
across the very top, to keep the green identity consistent site-wide.

To stop the website, go back to the terminal and press `Ctrl + C`.

---

## Which HTML file uses which CSS/JS file

Each HTML page has **its own dedicated CSS file** — nothing is shared between
them, so you'll always find exactly one stylesheet per page, right next to
it in `public/css/`. The one deliberate exception: every public page also
loads `navbar.css` + `navbar.js`, since the navigation bar is meant to be
identical everywhere (see "The full public site structure" above).

| HTML file | Its dedicated CSS file | JS file it uses |
|---|---|---|
| `public/index.html` (homepage) | `public/css/home.css` + `navbar.css` | `public/js/home.js` (stats + Latest Updates preview) + `navbar.js` |
| `public/login.html` | `public/css/login.css` + `navbar.css` | inline `<script>` + `navbar.js` |
| `public/register.html` | `public/css/register.css` + `navbar.css` | inline `<script>` + `navbar.js` |
| `public/forgot-password.html` | `public/css/forgot-password.css` + `navbar.css` | inline `<script>` + `navbar.js` |
| `public/reset-password.html` | `public/css/reset-password.css` + `navbar.css` | inline `<script>` + `navbar.js` |
| `public/programs.html` | `public/css/programs.css` + `navbar.css` | `navbar.js` |
| `public/about.html` | `public/css/about.css` + `navbar.css` | `navbar.js` |
| `public/officials.html` | `public/css/officials.css` + `navbar.css` | `public/js/officials.js` + `navbar.js` |
| `public/news.html` | `public/css/news.css` + `navbar.css` | `public/js/news.js` + `navbar.js` |
| `public/knowledge-corner.html` | `public/css/knowledge-corner.css` + `navbar.css` | `public/js/knowledge-corner.js` + `navbar.js` |
| `public/transparency.html` | `public/css/transparency.css` + `navbar.css` | `public/js/transparency.js` + `navbar.js` |
| `public/issuances.html` | `public/css/issuances.css` + `navbar.css` | `public/js/issuances.js` + `navbar.js` |
| `public/downloads.html` | `public/css/downloads.css` + `navbar.css` | `public/js/downloads.js` + `navbar.js` |
| `public/faqs.html` | `public/css/faqs.css` + `navbar.css` | `public/js/faqs.js` + `navbar.js` |
| `public/contact.html` | `public/css/contact.css` + `navbar.css` | inline `<script>` + `navbar.js` |
| `public/search.html` | `public/css/search.css` + `navbar.css` | `public/js/search.js` + `navbar.js` |
| `public/dashboard.html` | `public/css/dashboard.css` | `public/js/dashboard.js` (no navbar — the dashboard has its own sidebar) |

Each HTML file's `<link rel="stylesheet">` tag points only to its own file —
e.g. open `dashboard.html` and you'll see `href="/css/dashboard.css"`, not a
shared file. If you ever want to change how a specific page looks, just open
the one CSS file with the matching name and everything you need is right
there (no need to search through anyone else's styles).

---

## How the project is organized

```
mafar-lds-portal/
├── server.js              ← starts the website
├── .env.example           ← copy to .env and fill in (session secret, email)
├── .gitignore              ← keeps .env and node_modules out of version control
├── routes/
│   ├── auth.js             ← register / login / logout / forgot-password logic
│   ├── clients.js          ← Client Registry API (add/edit/delete/search)
│   ├── programs.js         ← Programs API (add/edit/delete)
│   ├── projects.js         ← Projects API (linked to a Program, add/edit/delete)
│   ├── reports.js          ← summary totals + CSV export endpoints + public-summary (homepage stats)
│   ├── users.js            ← admin-only account management API + public staff directory
│   ├── news.js             ← News + Knowledge Corner feed (public read + admin-only management)
│   ├── resources.js        ← Issuances / Downloads / Transparency docs (one shared system)
│   ├── faqs.js             ← FAQs (public read + admin-only management)
│   └── contact.js          ← Contact Us form → emails via utils/mailer.js
├── middleware/
│   └── auth.js              ← blocks pages/API calls from people who aren't logged in
├── utils/
│   ├── db.js                ← simple database helper (reads/writes JSON files)
│   └── mailer.js             ← sends emails (or logs them if no SMTP set) — used by
│                                both Forgot Password and Contact Us
├── data/
│   ├── users.json           ← registered accounts (passwords are encrypted)
│   ├── clients.json         ← registry records
│   ├── programs.json        ← program records
│   ├── projects.json        ← project records (each references a program's id)
│   ├── news.json            ← News + Knowledge Corner posts (each has a section + category)
│   ├── resources.json       ← Issuances / Downloads / Transparency documents
│   └── faqs.json            ← FAQ question/answer pairs
└── public/                  ← everything shown in the browser
    ├── index.html            ← homepage OVERVIEW (welcome + stats + explore-site grid + BARMM-style footer)
    ├── login.html
    ├── register.html
    ├── forgot-password.html  ← step 1: request a reset link
    ├── reset-password.html   ← step 2: set a new password using the token
    ├── programs.html         ← Flagship Programs (BInHI/LUPA/ISDA) + tracked programs
    ├── about.html             ← Vision/Mission/Mandate, Org Structure, Official Logo
    ├── officials.html        ← 6 tabs: Minister's Corner, Regional, Directory + BARMM-wide
    ├── news.html              ← Regional/Provincial/PRDP/MIADP/SDF/BAFTI tabs
    ├── knowledge-corner.html  ← the full 10-tab Knowledge Corner (moved off the homepage)
    ├── transparency.html     ← Transparency Seal, Citizen's Charter, Procurement, Vacant Position
    ├── issuances.html        ← Memorandum/Administrative Orders
    ├── downloads.html        ← Downloadable forms list
    ├── faqs.html              ← Accordion-style FAQ list
    ├── contact.html           ← Contact form
    ├── search.html            ← Site search results
    ├── dashboard.html        ← registry + programs + news + resources + faqs + users screens
    ├── images/
    │   ├── mafar-seal.png     ← MAFAR ministry seal (banner/sidebar logo)
    │   ├── barmm-seal.png     ← BARMM regional seal (homepage footer)
    │   └── officials/          ← photos used in the homepage Leadership slideshow
    │       ├── macacua.jpg
    │       ├── hassan.jpg
    │       ├── solaiman.jpg
    │       └── ansano.jpg
    ├── css/
    │   ├── navbar.css              ← SHARED by every public page (the mega-menu + banner)
    │   ├── home.css               ← styles ONLY for index.html
    │   ├── login.css               ← styles ONLY for login.html
    │   ├── register.css            ← styles ONLY for register.html
    │   ├── forgot-password.css     ← styles ONLY for forgot-password.html
    │   ├── reset-password.css      ← styles ONLY for reset-password.html
    │   ├── programs.css            ← styles ONLY for programs.html
    │   ├── about.css               ← styles ONLY for about.html
    │   ├── officials.css           ← styles ONLY for officials.html
    │   ├── news.css                ← styles ONLY for news.html
    │   ├── knowledge-corner.css    ← styles ONLY for knowledge-corner.html
    │   ├── transparency.css        ← styles ONLY for transparency.html
    │   ├── issuances.css           ← styles ONLY for issuances.html
    │   ├── downloads.css           ← styles ONLY for downloads.html
    │   ├── faqs.css                ← styles ONLY for faqs.html
    │   ├── contact.css             ← styles ONLY for contact.html
    │   ├── search.css              ← styles ONLY for search.html
    │   └── dashboard.css           ← styles ONLY for dashboard.html
    └── js/
        ├── navbar.js          ← SHARED by every public page (builds the mega-menu)
        ├── officials.js       ← tab switching on officials.html (6 tabs)
        ├── home.js            ← homepage stats + Latest Updates preview
        ├── knowledge-corner.js ← tab switching + data loading on knowledge-corner.html
        ├── news.js            ← tab switching + data loading on news.html
        ├── transparency.js    ← tab switching + Procurement/Vacant Position lists
        ├── issuances.js       ← tab switching + data loading on issuances.html
        ├── downloads.js       ← loads the downloadable forms list
        ├── faqs.js            ← loads FAQs + accordion expand/collapse
        ├── search.js          ← client-side search across News/Knowledge Corner/FAQs
        └── dashboard.js       ← all dashboard logic
```

### How the login system works (in plain language)
1. When someone registers, their password is scrambled using a technique
   called **hashing** (via the `bcryptjs` package) — the real password is
   never saved anywhere, only the scrambled version.
2. When they log in, we hash the password they type and compare it to the
   saved scrambled version. If they match, we know it's really them.
3. We then remember they're logged in using a **session cookie** — a small
   note the browser keeps that says "this visitor is logged in as user #3."
4. Every page and API request under `/dashboard.html` and `/api/clients`,
   `/api/programs` checks that cookie first (see `middleware/auth.js`). No
   valid session, no access — this is what "requires login" means here.

### How the "database" works
This project stores data in plain JSON files inside the `data/` folder
instead of a full database server, so a beginner can open those files in
Notepad and literally see the data. That's the whole "API and database"
picture at this stage: your **API** is the set of `/api/...` web addresses
in `routes/`, and your **database** is those JSON files, read and written
through `utils/db.js`.

---

## Upgrading to a real database later (optional, for when you're ready)

When you're ready to put this online for real, many people are typing into
it, and you want it to survive years of use, swap the JSON files for a real
database:

- **Easiest paid/hosted option:** [Supabase](https://supabase.com) (free
  tier) or [Neon](https://neon.tech) — both give you a real PostgreSQL
  database with a web dashboard, no server setup needed.
- **Self-hosted option:** Install **PostgreSQL** or **MySQL**, then replace
  the functions in `utils/db.js` with real SQL queries (for example, using
  the `pg` npm package for PostgreSQL).
- The rest of the app (`routes/`, `public/`) barely needs to change, because
  they only ever call `readTable()` / `writeTable()` — you'd just rewrite
  those two functions to talk to the real database instead of a JSON file.

## Putting the website on the internet (optional)

To let other people (not just your own computer) visit the site:
1. Create a free account on a hosting service such as **Render.com** or
   **Railway.app**.
2. Upload this project (they both support connecting a GitHub repository).
3. Set the "Start Command" to `npm start`.
4. Before going live, change the `secret` value inside `server.js`
   (`session-secret-change-me`) to a long random string, and consider
   switching to a real database as described above.

---

## Troubleshooting

- **"npm: command not found"** → Node.js isn't installed correctly; redo Step 1.
- **"Port 3000 already in use"** → Close other terminals running `npm start`,
  or edit `server.js` and change `PORT` to another number like `3001`.
- **Changes to code don't show up** → Stop the server (`Ctrl + C`) and run
  `npm start` again after saving your file.
