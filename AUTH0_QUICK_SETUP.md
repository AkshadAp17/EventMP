# 🚀 Quick Auth0 Setup for EventMaster

## What You Need
1. Auth0 account (free at [auth0.com](https://auth0.com))
2. Your Replit project URL

## Step 1: Create Auth0 App
1. Go to [auth0.com](https://auth0.com) and sign up/login
2. Click **Applications** → **+ Create Application**
3. Name: `EventMaster`
4. Type: **Single Page Application**
5. Click **Create**

## Step 2: Configure URLs
In your new app's **Settings** tab, add these URLs (replace `YOUR-REPLIT-URL` with your actual project URL):

**Allowed Callback URLs:**
```
https://YOUR-REPLIT-URL.replit.app/api/auth/callback
```

**Allowed Logout URLs:**
```
https://YOUR-REPLIT-URL.replit.app/
```

**Allowed Web Origins:**
```
https://YOUR-REPLIT-URL.replit.app
```

**Allowed Origins (CORS):**
```
https://YOUR-REPLIT-URL.replit.app
```

Click **Save Changes**.

## Step 3: Get Your Credentials
Copy these from the **Settings** tab:
- **Domain** (like: `dev-abc123.us.auth0.com`)
- **Client ID** (long string)
- **Client Secret** (click "Show" to reveal)

## Step 4: Add to Replit Secrets
In your Replit project, go to **🔒 Secrets** and add:

| Key | Value |
|-----|-------|
| `AUTH0_DOMAIN` | Your Auth0 domain |
| `AUTH0_CLIENT_ID` | Your Client ID |
| `AUTH0_CLIENT_SECRET` | Your Client Secret |
| `AUTH0_BASE_URL` | `https://YOUR-REPLIT-URL.replit.app` |
| `SESSION_SECRET` | Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |

## Step 5: Test
1. Restart your Replit app
2. Go to `/auth` page
3. Click **"Continue with Auth0"**
4. Login/signup with Auth0
5. You should be redirected back as logged in!

## Quick Access
- **Admin Login**: `admin@eventmaster.com` / `admin123`
- **Auth Page**: `/auth`

## Need Help?
- Check **Monitoring** → **Logs** in Auth0 for errors
- Verify all URLs match exactly (no trailing slashes)
- Make sure all 5 secrets are set in Replit

That's it! Your users can now login with Auth0 social providers like Google, Facebook, etc.