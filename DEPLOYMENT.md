# Free Forever Deployment Guide: CreatorPulse

This step-by-step guide walks you through deploying CreatorPulse **100% free forever** with **no credit card required**.

---

## The Free Forever Tech Stack

| Service | Provider | Free Tier Policy | Cost |
| :--- | :--- | :--- | :--- |
| **Web App & API** | **Vercel** (Hobby Plan) | Unlimited serverless execution, global CDN, automated GitHub CI/CD, free SSL | **$0 / forever** |
| **PostgreSQL Database** | **Neon** (Serverless Postgres) | 0.5 GiB storage, autoscale, native connection pooling, does not pause | **$0 / forever** |
| **YouTube Data API** | **Google Cloud Console** | 10,000 quota units / day refreshed every 24 hours at midnight PST | **$0 / forever** |

---

## Step 1: Set Up Free PostgreSQL Database on Neon (2 Minutes)

1. Go to **[https://neon.tech](https://neon.tech)** and click **Sign Up** (Sign in with your GitHub or Google account). No credit card required.
2. In the Neon dashboard, click **Create Project**:
   - **Project name**: `creatorpulse`
   - **Postgres version**: 16 (default)
   - **Region**: Choose the region closest to you or your target audience (e.g., US East, Frankfurt, Singapore)
3. Once created, Neon displays your connection details. Under **Connection string**, select:
   - Mode: **Pooled connection**
   - It will look like:
     ```text
     postgresql://user:password@ep-cool-fog-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
4. Copy this string — this will be your `DATABASE_URL`.
5. Run the database migration from your local project terminal to initialize all tables in Neon:
   ```powershell
   $env:DATABASE_URL="postgresql://user:password@ep-cool-fog-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   npx prisma db push
   ```
   *All 40 tables, indexes, and relations are pushed directly to your Neon database.*

---

## Step 2: Push Your Code to GitHub (2 Minutes)

1. Go to **[https://github.com/new](https://github.com/new)**.
2. Create a new repository:
   - **Repository name**: `creatorpulse` (or any name you choose)
   - Choose **Private** (recommended to keep your project private) or Public.
   - Leave "Initialize with README" **unchecked** (we already have a complete repo).
3. In your project directory terminal, link and push:
   ```powershell
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/creatorpulse.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 3: Deploy on Vercel (2 Minutes)

1. Go to **[https://vercel.com](https://vercel.com)** and sign in with your GitHub account.
2. On your Vercel dashboard, click **Add New...** → **Project**.
3. Locate your `creatorpulse` repository from the GitHub list and click **Import**.
4. In the **Configure Project** screen:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: `./` (default)
5. Expand **Environment Variables** and add the following keys:

| Environment Variable | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:password@ep-...pooler...neon.tech/neondb?sslmode=require` | Your Neon pooled connection string |
| `YOUTUBE_API_KEY` | `AIzaSyDjjQnrSdPudIH526SDR9lsKOicpVSGq8w` | Your Google YouTube Data API v3 key |
| `NEXTAUTH_SECRET` | `creatorpulse-production-secure-secret-32-chars` | Random secure secret string |
| `ENCRYPTION_KEY_32_BYTES` | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` | 32-byte hex key for token encryption |
| `NODE_ENV` | `production` | Production environment flag |

6. Click **Deploy**.

Vercel will run `prisma generate`, compile all routes, and launch your website on a free URL:
👉 **`https://your-project.vercel.app`**

---

## Step 4: (Optional) Connect Your Own Custom Domain

Vercel allows you to add any custom domain (e.g. `creatorpulse.com` or `mytools.xyz`) completely free with automatic SSL:
1. In Vercel Project Settings → **Domains**.
2. Type your domain name and add the DNS records (`CNAME` / `A` record) shown on screen.
3. Vercel automatically generates and auto-renews free SSL/HTTPS certificates forever.

---

## Keeping It Free Forever Best Practices

1. **Daily YouTube Quota**: The application includes built-in in-memory and sliding-window caching (`quota-cache.ts`). Standard usage consumes < 1,000 units/day well within the 10,000 daily free allowance.
2. **Neon Database Storage**: 0.5 GiB easily stores over 500,000 video records and swipe files.
3. **Automatic Updates**: Every time you run `git push origin main`, Vercel automatically rebuilds and deploys the latest version with zero downtime.
