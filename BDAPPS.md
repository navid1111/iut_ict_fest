# BDApps integration — how to use & test it

Everything BDApps lives in `src/bdapps/`. This doc shows how to run and **test each endpoint** three ways: offline (no SIM), live from the terminal, and full end‑to‑end.

## What's in the boxhttps://github.com/irfanAbir1231/agent-lens

```
src/bdapps/
  config.ts      # loads BDAPPS_APP_ID / PASSWORD from .env
  phone.ts       # toTelAddress(): "01812345678" -> "tel:8801812345678"
  types.ts       # request/response types
  client.ts      # BdappsClient: sendSms, sendUssd, requestOtp, verifyOtp,
                 #   queryBalance, listPaymentInstruments, directDebit,
                 #   getSubscriptionStatus, subscribe, unsubscribe  + `bdapps` singleton
  ussdMenu.ts    # handleUssd(): example USSD menu (pure, easy to test)
  cli.ts         # terminal tester (npm run bdapps -- ...)
  client.test.ts # offline unit tests (mocked network)
src/routes/
  bdappsListeners.ts  # INCOMING webhooks: /bdapps/sms, /bdapps/ussd, /bdapps/subscription
  bdappsTest.ts       # OUTGOING triggers:  /api/bdapps/*  (for Postman/curl)
```

Use it in code:
```ts
import { bdapps, isSuccess } from "./bdapps/index.js";

const res = await bdapps.sendSms("01812345678", "Hello!");
if (isSuccess(res)) console.log("sent!");
```

---

## Step 1 — Configure
```bash
cp .env.example .env      # (PowerShell: Copy-Item .env.example .env)
```
Fill in `BDAPPS_APP_ID` and `BDAPPS_PASSWORD` from the dashboard (see `../../BDApps-Service-Setup.md`).
Make sure your **public IP is whitelisted** in the app's *Allowed Host Address(es)* or every call returns `E1303`.

---

## Step 2 — Test each endpoint

### 🟢 Way A — Offline unit tests (no credentials, no SIM)
Proves every request is built correctly. **Run this anytime.**
```bash
npm test
```
All 16 BDApps tests should pass. Great sanity check before the hackathon even starts.

### 🟡 Way B — Live, from the terminal (needs credentials + whitelisted IP)
Fires the real API and prints the response. Some need a real **Robi** number.
```bash
npm run bdapps -- otp:request 01812345678        # texts a code, returns referenceNo
npm run bdapps -- otp:verify <referenceNo> 123456
npm run bdapps -- sms 01812345678 Hello from the hackathon
npm run bdapps -- balance 01812345678
npm run bdapps -- sub:status 01812345678
npm run bdapps -- charge 01812345678 2           # ⚠️ real money
```
Full command list: `npm run bdapps` (no args).

### 🟡 Way C — Live, via HTTP (Postman / curl)
Start the server, then POST to the test routes:
```bash
npm run dev      # http://localhost:3000
```
```powershell
# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/bdapps/otp/request -Method Post `
  -ContentType application/json -Body '{"mobile":"01812345678"}'
```
Other routes: `/api/bdapps/sms`, `/otp/verify`, `/balance`, `/pi`, `/charge`, `/subscription/status|subscribe|unsubscribe`, `/broadcast`.

---

## Step 3 — Test the INCOMING listeners (SMS/USSD/subscription)

These are triggered by BDApps, not you. Two ways to test:

### Locally simulate (verifies your logic + that you ACK correctly)
With `npm run dev` running, pretend to be BDApps:
```powershell
# Simulate a user dialling your USSD code
Invoke-RestMethod -Uri http://localhost:3000/bdapps/ussd -Method Post `
  -ContentType application/json `
  -Body '{"ussdOperation":"mo-init","sessionId":"S1","sourceAddress":"tel:MASKED","message":"","applicationId":"APP_x"}'

# Simulate a user texting your short code
Invoke-RestMethod -Uri http://localhost:3000/bdapps/sms -Method Post `
  -ContentType application/json `
  -Body '{"sourceAddress":"tel:MASKED","message":"hello","applicationId":"APP_x"}'
```
You'll see the request logged and get `{ statusCode: "S1000" }` back. (The *reply* push — sendUssd/sendSms — only actually delivers with real credentials + a live session.)

### Real end‑to‑end with ngrok (a real phone texts/dials you)
Your laptop isn't reachable from the internet, so tunnel it:
```bash
npm run dev                     # terminal 1
npx ngrok http 3000             # terminal 2  -> gives https://abcd-xx.ngrok-free.app
```
Then in BDApps provisioning, set the listener URLs to the ngrok URL:
- SMS *Message Receiving URL* → `https://abcd-xx.ngrok-free.app/bdapps/sms`
- USSD *Connection URL* → `https://abcd-xx.ngrok-free.app/bdapps/ussd`
- Subscription *Notification URL* → `https://abcd-xx.ngrok-free.app/bdapps/subscription`

Now text your keyword / dial your USSD code from a real Robi phone and watch your terminal.
> ⚠️ ngrok free URLs change every restart — update provisioning each time.

---

## What's testable how — quick table

| Endpoint | Offline test | CLI/HTTP (live) | Needs |
|---|:--:|:--:|---|
| Send SMS | ✅ | ✅ | creds, IP, Robi number |
| Broadcast SMS | ✅ | ✅ | creds, IP, subscribers |
| Request/Verify OTP | ✅ | ✅ | creds, IP, Robi number *(easiest live test)* |
| Query Balance | ✅ | ✅ | creds, IP, Robi number |
| Payment Instruments | ✅ | ✅ | creds, IP |
| Direct Debit | ✅ | ✅ | creds, IP, Robi number, **real money** |
| Subscription status/sub/unsub | ✅ | ✅ | creds, IP |
| Receive SMS (listener) | ✅ (curl sim) | ✅ (ngrok) | public URL + real phone |
| Receive USSD (listener) | ✅ (curl sim) | ✅ (ngrok) | public URL + real phone |
| Subscription notify (listener) | ✅ (curl sim) | ✅ (ngrok) | public URL |

---

## Gotchas
- **`E1303`** → your IP isn't whitelisted. Update *Allowed Host Address(es)*.
- **`E1313`** → wrong `applicationId`/`password`.
- **Masked numbers** → incoming `sourceAddress` is scrambled; reply/charge with that exact value (the client passes `tel:` values through unchanged).
- **Real money** → `charge` actually debits balance. Use tiny amounts (1–2 tk) to test.
- **Rate limits** → `E1318` (per‑second) / `E1319` (per‑day) are retry‑able; back off and retry.
- The `/api/bdapps/*` test routes are unauthenticated — remove or protect them before any real deployment.
```
