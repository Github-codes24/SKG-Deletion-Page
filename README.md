# SKG TRAVEL Account Deletion Page

Simple Next.js SPA for the Google Play account deletion URL requirement.

## What it does

- Shows SKG TRAVEL account deletion steps.
- Supports both User App and Driver App.
- Fetches the deletion policy from:
  `https://taxi.technokrate.com/api/getDeleteAccount`
- Falls back to standard 7 working days wording when the API is unavailable.
- Creates a pre-filled email request so SKG TRAVEL can verify and delete the account manually.

## Local setup

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment

Create `.env.local` if you need to change the support email or API URL:

```bash
NEXT_PUBLIC_SUPPORT_EMAIL=your-support-email@example.com
DELETE_POLICY_API_URL=https://taxi.technokrate.com/api/getDeleteAccount
```

## Checks

```bash
npm run lint
npm run build
```

## Play Console

After deployment, use the deployed homepage URL as the **Delete account URL**.
