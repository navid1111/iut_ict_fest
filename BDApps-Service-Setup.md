# 🛠️ BDApps — Create Your App & Services (step by step)

You already have a BDApps **account**. Now you create an **application** and turn on the **services** inside it. That's also where you get the `applicationId` + `password` your code needs.

> **Key idea:** "creating a service" = creating a **Pro application** and enabling SMS / USSD / CAAS / Subscription inside it. It's one wizard.

---

## Step 0 — What you'll walk away with
By the end you'll have:
- ✅ An `applicationId` (looks like `APP_EXAMPLE`)
- ✅ A `password` (a ~32-character API key)
- ✅ Services enabled (SMS, USSD, CAAS, Subscription)
- ✅ Your **listener URLs** registered (so BDApps can call your server)
- ✅ Your server **IP whitelisted** (so BDApps accepts your calls)

Put the first two into `.env` (see the code guide) and you can start testing.

---

## Step 1 — Open Provisioning
1. Go to **https://user.bdapps.com** and log in.
2. On the dashboard, click the **Provisioning** tile.
3. Click **Create New App** (the big ＋ card).

---

## Step 2 — Details (screen 1 of 3)
Fill in:
| Field | What to put |
|---|---|
| **Application Name** | e.g. `HackApp` |
| **Application Description** | one line about what it does |
| **Allowed Host Address(es)** ⚠️ | The **public IP** your server/laptop will call BDApps from. See note below. |
| Whitelisted / Blacklisted Numbers | Leave blank (or add test numbers) |

Pick **Pro** as the app type (not Lite) so you get SMS + USSD + CAAS + Subscription + the downloadable option.

> ⚠️ **Allowed Host Address is the #1 gotcha.** If your server's IP isn't listed here, every API call fails with **`E1303`**.
> - Find your public IP: open https://ifconfig.me or google "what is my IP".
> - Home internet IPs change — if calls suddenly return `E1303` tomorrow, re-check and update this field.
> - If BDApps allows a range/wildcard, you can widen it; otherwise just paste your current public IP.

Click **Next**.

---

## Step 3 — Services (screen 2 of 3)
This is the important screen. On the left you'll see **1 SMS · 2 USSD · 3 CAAS · 4 Subscription · 5 Downloadable**. Turn on what you need and give each a URL that points to **your** server.

> These URLs are where **BDApps calls YOU** (incoming). With the code in this repo the paths are:
> - SMS → `https://YOUR_SERVER/bdapps/sms`
> - USSD → `https://YOUR_SERVER/bdapps/ussd`
> - Subscription → `https://YOUR_SERVER/bdapps/subscription`
>
> `YOUR_SERVER` = your deployed URL **or** an ngrok URL (see the testing guide). You can put a placeholder now and edit it later.

### 1) SMS
- **Enable Mobile Originated SMS** → **YES** → **Message Receiving URL** = `https://YOUR_SERVER/bdapps/sms`
- **Enable Mobile Terminated SMS** → **YES** (lets you send SMS out)
- Under the **Robi** sub-tab: pick an **SMS Short Code** (e.g. `21213`) and type an **SMS Keyword** (e.g. `HACK`) — this is what users text to reach you. Keyword can't be empty.
- Messages Per Second / Per Day: leave defaults (10 / 30000).

### 2) USSD
- **Connection URL** = `https://YOUR_SERVER/bdapps/ussd`
- Subscription Required → your choice (NO is simplest to start).

### 3) CAAS (only if you'll charge money)
- Enable it. Nothing to host — CAAS is outgoing only (you call BDApps to check balance / charge).

### 4) Subscription (only if you'll have subscribers)
- **Subscription Response Message** = e.g. `Welcome! You are now subscribed.`
- **Un-subscription Response Message** = e.g. `You have unsubscribed.`
- **Subscriber Confirmation Required** → YES
- **Send Subscription Notification** → YES → **Subscription Notification URL** = `https://YOUR_SERVER/bdapps/subscription`
- **Allow HTTP Subscription API** → YES

### 5) Downloadable (only for an Android app)
- Upload your `app-release.apk`, set Min SDK + Build version. **Skip this** if you're building a web/server app.

Click **Next**.

---

## Step 4 — Settings (screen 3 of 3)
Review everything, then **Save / Submit**. For a Pro app the submission may go for approval, but you typically get your credentials immediately for the sandbox.

---

## Step 5 — Get your credentials 🔑
Back on the Provisioning app list, find your app card. The **`APP_xxxxxx`** id is shown on the card. Open the app (click it / the key or ⋮ menu) to reveal the **password / API key**.

Copy both into `.env`:
```
BDAPPS_APP_ID=APP_EXAMPLE
BDAPPS_PASSWORD=the_long_api_key_here
```

---

## Quick FAQ

**Q: Do I need my own server right now?**
For **outgoing** calls (send SMS, OTP, charge, balance, subscribe) — **no**, you just need credentials + your IP whitelisted. You can test those from your laptop today.
For **incoming** calls (user texts you / dials USSD / subscription confirmations) — **yes**, BDApps needs a public URL. Use **ngrok** to expose your laptop (see the testing guide) or the shared BDApps server.

**Q: I don't have hosting at all.**
BDApps offers a shared server `103.108.140.219` with ready-made listeners (`/api/listener/sms_listener`, `/ussd_listener`, `/sub_listener`) and a hosting tutorial (`https://youtu.be/qItOzLA7dqM?t=321`). But since you're running your own Node backend, **ngrok is the faster path** for the hackathon.

**Q: What can I test without a real Robi SIM?**
The code's **unit tests** (mocked) verify every request is built correctly — run today, no SIM needed. **Live** SMS/OTP/charge tests need a real Robi number.

---

**Next:** open `BDAPPS.md` for the code + how to run each test.
