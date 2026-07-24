# 📱 BDApps API Cheatsheet

> Your one-page reference for the hackathon. Every API = **what it does**, **a request/response**, and **a quick real-world scenario**.

---

## 🧠 The mental model (read once)

There are **two servers**. Every API is one of two directions:

| Direction | Meaning | Example |
|---|---|---|
| **➡️ OUT** | *You* POST to `developer.bdapps.com` to **make something happen** | send an SMS, charge money |
| **⬅️ IN** | *BDApps* POSTs to **your** listener URL because **something happened** | a user texted you, dialed your USSD |

**Base URL:** `https://developer.bdapps.com`
**Every OUT request includes:** `applicationId` (e.g. `APP_EXAMPLE_SMS`) + `password` (32-char API key).
**Success is always:** `"statusCode": "S1000"`. Anything `E13xx` / `E18xx` = error (see bottom).
**Phone format:** `tel:8801XXXXXXXXX` (e.g. `01812345678` → `tel:8801812345678`).
**Privacy:** incoming `sourceAddress` is usually a **masked** id — use that masked id to reply/charge, not a real number.

---

## ⚡ Quick reference — all endpoints

| API | Dir | Endpoint | Use it for |
|---|---|---|---|
| Send SMS | ➡️ OUT | `POST /sms/send` | Notify / alert / reply by text |
| Receive SMS | ⬅️ IN | *your SMS listener* | User texts your shortcode |
| Delivery Report | ⬅️ IN | *your SMS listener* | "Was my SMS delivered?" |
| Send USSD | ➡️ OUT | `POST /ussd/send` | Show a `*123#` menu screen |
| Receive USSD | ⬅️ IN | *your USSD listener* | User dials your USSD code |
| Query Balance | ➡️ OUT | `POST /caas/balance/query` | Check user's mobile balance |
| Payment Instruments | ➡️ OUT | `POST /caas/list/pi` | List how a user can pay |
| Direct Debit | ➡️ OUT | `POST /caas/direct/debit` | Charge money from balance |
| Request OTP | ➡️ OUT | `POST /subscription/otp/request` | Send a verification code |
| Verify OTP | ➡️ OUT | `POST /subscription/otp/verify` | Check the code + log in |
| Subscription Status | ➡️ OUT | `POST /subscription/getStatus` | Is this user subscribed? |
| Subscribe / Unsubscribe | ➡️ OUT | `POST /subscription/send` | Join (`action:1`) / leave (`action:0`) |
| Subscription Notify | ⬅️ IN | *your subscription listener* | Telecom confirmed a sub change |

**Which API for which problem?**
- Login / verify a phone → **OTP**
- Send alerts / notifications → **Send SMS**
- Menu service, no internet → **USSD**
- Take payments → **Direct Debit** (+ **Query Balance** first)
- Daily-content / membership → **Subscription** + **Send SMS**

---

# 📩 SMS

## Send SMS — ➡️ OUT `POST /sms/send`
**Does:** Sends a text message to one number, many numbers, or everyone subscribed (`tel:all`).

**Request**
```json
{
  "applicationId": "APP_EXAMPLE_SMS",
  "password": "example_bdapps_password",
  "message": "Your OTP is 4821",
  "destinationAddresses": ["tel:8801812345678"]
}
```
**Response**
```json
{
  "statusCode": "S1000",
  "requestId": "101307311109540017",
  "statusDetail": "Request was successfully processed",
  "destinationResponses": [
    { "statusCode": "S1000", "address": "tel:8801812345678", "messageId": "101307311109540017" }
  ],
  "version": "1.0"
}
```
**💡 Scenario:** A bus-ticket app texts the passenger *"Seat B4 booked, bus leaves 9:00 PM."* right after booking.

**Notes / optional fields:**
- `destinationAddresses`: array. Use `["tel:all"]` to **broadcast** to all subscribers.
- `encoding`: `0`=English, `16`=Bengali (বাংলা), `240`=Flash, `245`=Binary.
- `deliveryStatusRequest`: `1` if you want a delivery report back.
- `sourceAddress`: custom sender name (must be pre-approved).

---

## Receive SMS — ⬅️ IN (your SMS listener URL)
**Does:** When a user texts your short code + keyword, BDApps POSTs the message to your server.

**BDApps sends you**
```json
{
  "message": "STOP",
  "sourceAddress": "tel:8801832160987",
  "requestId": "51307311302350037",
  "applicationId": "APP_EXAMPLE_INBOUND",
  "encoding": "0",
  "version": "1.0"
}
```
**You reply**
```json
{ "statusCode": "S1000", "statusDetail": "Success" }
```
**💡 Scenario:** A voting app: viewers text `VOTE 3` to your shortcode; your listener reads `message`, tallies vote #3, and texts back *"Thanks, your vote is counted!"*

---

## Delivery Status Report — ⬅️ IN (your SMS listener URL)
**Does:** If you asked for a delivery report, BDApps tells you whether your sent SMS actually arrived. Match it to your original message via `requestId`.

**BDApps sends you**
```json
{
  "destinationAddress": "tel:8801832160987",
  "timeStamp": "20120113082110",
  "requestId": "51307311302350037",
  "deliveryStatus": "DELIVERED"
}
```
**💡 Scenario:** An alert system marks a message "✅ delivered" or retries if it comes back `UNDELIVERABLE`.
**`deliveryStatus` values:** `DELIVERED`, `EXPIRED`, `DELETED`, `UNDELIVERABLE`, `ACCEPTED`, `UNKNOWN`, `REJECTED`.

---

# 📟 USSD (the `*123#` menu style)

USSD is a **live session**. `sessionId` ties the back-and-forth together.
- **From user:** `mo-init` (they started it), `mo-cont` (they replied to your menu).
- **From you:** `mt-cont` (show text, **keep open** for their reply), `mt-fin` (show text, **end** session).

## Send USSD — ➡️ OUT `POST /ussd/send`
**Does:** Displays a menu/message on the user's screen during a USSD session.

**Request**
```json
{
  "applicationId": "APP_EXAMPLE_USSD",
  "password": "example_bdapps_password",
  "sessionId": "1330929317043",
  "destinationAddress": "tel:8801812345678",
  "ussdOperation": "mt-cont",
  "message": "1. Check balance\n2. Buy package\n3. Exit"
}
```
**Response**
```json
{ "statusCode": "S1000", "requestId": "101308060614220956", "statusDetail": "Success", "version": "1.0" }
```
**💡 Scenario:** A quiz service: user dials `*7788#`, you reply with `mt-cont` *"Q1: Capital of Bangladesh? 1.Dhaka 2.Khulna"*; when they press 1 you send `mt-fin` *"Correct! 🎉"*.
**Note:** `encoding` `440`=ASCII, `16`=Bengali.

---

## Receive USSD — ⬅️ IN (your USSD listener URL)
**Does:** When the user dials your code or picks a menu option, BDApps POSTs it to you.

**BDApps sends you**
```json
{
  "message": "1",
  "ussdOperation": "mo-init",
  "sessionId": "1209992331266121",
  "sourceAddress": "tel:8801812345678",
  "applicationId": "APP_EXAMPLE_USSD",
  "requestId": "071308060343170263",
  "encoding": "16",
  "version": "1.0"
}
```
**You reply** `{ "statusCode": "S1000", "statusDetail": "Success" }` — then call **Send USSD** to show the next screen.

**💡 Scenario:** A farmer dials `*1234#` (`mo-init`) → your server checks their district → sends back today's crop prices with `mt-fin`.

---

# 💰 CAAS — Charging as a Service (money)

## Query Balance — ➡️ OUT `POST /caas/balance/query`
**Does:** Reads a subscriber's available mobile balance and account type.

**Request**
```json
{
  "applicationId": "APP_EXAMPLE_CAAS",
  "password": "example_bdapps_password",
  "subscriberId": "tel:8801812345678",
  "paymentInstrumentName": "Mobile Account"
}
```
**Response**
```json
{
  "statusCode": "S1000",
  "chargeableBalance": "100",
  "accountType": "PREPAID",
  "accountStatus": "0",
  "statusDetail": "Request was successfully processed"
}
```
**💡 Scenario:** Before charging 10 tk for a premium article, you check `chargeableBalance` and show *"Insufficient balance"* instead of failing the payment.

---

## Get Payment Instrument List — ➡️ OUT `POST /caas/list/pi`
**Does:** Lists the ways a subscriber can pay (e.g. "Mobile Account").

**Request**
```json
{
  "applicationId": "APP_EXAMPLE_CAAS",
  "password": "example_bdapps_password",
  "subscriberId": "tel:8801812345678",
  "type": "all"
}
```
**Response**
```json
{
  "statusCode": "S1000",
  "statusDetail": "Success",
  "paymentInstrumentList": [ { "name": "Mobile Account", "type": "sync" } ]
}
```
**💡 Scenario:** A checkout page asks BDApps which payment methods this user has, then shows those as the payment options.

---

## Direct Debit — ➡️ OUT `POST /caas/direct/debit`
**Does:** Charges a specific amount from the subscriber's balance. **This is how you take money.**

**Request**
```json
{
  "applicationId": "APP_EXAMPLE_CAAS",
  "password": "example_bdapps_password",
  "subscriberId": "tel:8801812345678",
  "paymentInstrumentName": "Mobile Account",
  "amount": "5",
  "externalTrxId": "ORDER-2026-0001"
}
```
**Response**
```json
{
  "statusCode": "S1000",
  "timeStamp": "2013-08-01T08:43:34.344+05:30",
  "externalTrxId": "ORDER-2026-0001",
  "internalTrxId": "913080108430074",
  "statusDetail": "Request was successfully processed"
}
```
**💡 Scenario:** A donation app charges 20 tk to a flood-relief fund; `externalTrxId` is your own unique id so you can confirm the exact charge later.
**Notes:** `externalTrxId` = **you invent it** (must be unique per charge); BDApps echoes it back. Fails with `E1326`/`E1308` if balance is too low.

---

# 🔐 OTP — verify a phone number

## Request OTP — ➡️ OUT `POST /subscription/otp/request`
**Does:** Sends a one-time code by SMS and returns a `referenceNo` you keep for the verify step.

**Request**
```json
{
  "applicationId": "APP_EXAMPLE_OTP",
  "password": "example_bdapps_password",
  "subscriberId": "tel:8801800080103",
  "applicationHash": "abcdefgh",
  "applicationMetaData": {
    "client": "MOBILEAPP",
    "device": "Samsung S10",
    "os": "android 8",
    "appCode": "https://play.google.com/store/apps/details?id=my.app"
  }
}
```
**Response**
```json
{ "statusCode": "S1000", "statusDetail": "Success", "referenceNo": "213561321321613", "version": "1.0" }
```
**💡 Scenario:** User enters their phone number on your login screen → this fires → they get *"Your code is 4821."*

---

## Verify OTP — ➡️ OUT `POST /subscription/otp/verify`
**Does:** Checks the code the user typed. On success you get their (masked) `subscriberId` — that's your logged-in user id.

**Request**
```json
{
  "applicationId": "APP_EXAMPLE_OTP",
  "password": "example_bdapps_password",
  "referenceNo": "213561321321613",
  "otp": "123564"
}
```
**Response**
```json
{
  "statusCode": "S1000",
  "statusDetail": "Success",
  "subscriptionStatus": "REGISTERED",
  "subscriberId": "tel:masked_xxxxx",
  "version": "1.0"
}
```
**💡 Scenario:** User types `4821` → this returns `S1000` → you create their session and log them in. **Store the returned `subscriberId`** and use it for all future calls for this user.
**OTP errors:** `E1850` invalid OTP · `E1851` expired · `E1852` too many attempts.

---

# 👥 Subscription

## Get Status — ➡️ OUT `POST /subscription/getStatus`
**Does:** Tells you whether a user is currently subscribed.

**Request**
```json
{
  "applicationId": "APP_EXAMPLE_SMS",
  "password": "example_bdapps_password",
  "subscriberId": "tel:8801812345678",
  "version": "1.0"
}
```
**Response**
```json
{ "statusCode": "S1000", "subscriptionStatus": "REGISTERED", "statusDetail": "Success", "version": "1.0" }
```
**💡 Scenario:** When a user opens premium content, you check status first: `REGISTERED` → show it; `UNREGISTERED` → show a "Subscribe" button.
**`subscriptionStatus`:** `REGISTERED` or `UNREGISTERED`.

---

## Subscribe / Unsubscribe — ➡️ OUT `POST /subscription/send`
**Does:** Adds (`action:"1"`) or removes (`action:"0"`) a user from your service.

**Request (subscribe)**
```json
{
  "applicationId": "APP_EXAMPLE_SMS",
  "password": "example_bdapps_password",
  "subscriberId": "tel:8801812345678",
  "action": "1",
  "version": "1.0"
}
```
**💡 Scenario:** User taps *"Join Daily English Word – 2tk/day"* → `action:"1"`. Later texts `STOP` → your listener fires this again with `action:"0"`.

---

## Subscription Notification — ⬅️ IN (your subscription listener URL)
**Does:** After the telecom **confirms** a subscribe/unsubscribe, BDApps notifies your server so you can update your database.

**BDApps sends you**
```json
{
  "status": "REGISTERED",
  "subscriberId": "tel:8801812345678",
  "applicationId": "APP_EXAMPLE_SMS",
  "timeStamp": "2026-07-24 09:15:00",
  "frequency": "MONTHLY"
}
```
**You reply** `{ "statusCode": "S1000" }`.
**💡 Scenario:** Only when this arrives do you actually add the user to your "active subscribers" table and start sending them daily content.

---

# 🚦 Status & Error codes

| Code | Meaning |
|---|---|
| **S1000** | ✅ Success |
| E1313 | Auth failed — bad `applicationId`/`password` |
| E1303 | Your server IP isn't whitelisted (add it in "Allowed Host Address(es)") |
| E1312 | Invalid request — a mandatory field is missing/wrong |
| E1309 | SMS service not allowed for this app |
| E1311 | Mobile-terminated SMS not enabled in provisioning |
| E1315 | Service not found or not active |
| E1317 | The MSISDN (number) is invalid or not allowed |
| E1325 | Bad address format — must be `tel:8801812345678` |
| E1326 | Insufficient balance *(retry-able)* |
| E1308 | Permanent charging error (e.g. insufficient balance) |
| E1337 | Duplicate request |
| E1342 | Number is blacklisted |
| E1343 | Number not whitelisted (during test/whitelist mode) |
| E1318 | Per-second rate limit hit *(retry-able)* |
| E1319 | Daily limit hit |
| E1601 | Unexpected system error |
| E1602 | Delivery failed — retry *(retry-able)* |
| E1603 | Temporary system error — retry *(retry-able)* |
| E1850 / E1851 / E1852 | OTP invalid / expired / too many attempts |

---

# ✅ Setup essentials (do these first)

1. Register at **`user.bdapps.com`** → **Provisioning** → **Create New App** (pick **Pro**).
2. **Details** step → put your server's public IP in **"Allowed Host Address(es)"** (or you'll get `E1303`).
3. **Services** step → enable SMS / USSD / CAAS / Subscription and set your **listener URLs**:
   - SMS → *Message Receiving URL*
   - USSD → *Connection URL*
   - Subscription → *Subscription Notification URL*
4. Copy your **`applicationId`** + **`password`** — they go in every OUT call.
5. Every listener you host must reply `{ "statusCode": "S1000" }` so BDApps knows you received it.

**No hosting?** BDApps offers a shared server at `103.108.140.219` with ready listeners:
`…/api/listener/sms_listener`, `…/api/listener/ussd_listener`, `…/api/listener/sub_listener`.

---
*Base URL: `https://developer.bdapps.com` · Success = `S1000` · Numbers = `tel:8801XXXXXXXXX`*
