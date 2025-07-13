# Auth0 Setup Instructions

## Prerequisites
You need an Auth0 account. If you don't have one, sign up at [auth0.com](https://auth0.com).

## Step 1: Create Auth0 Application

1. Log in to your [Auth0 Dashboard](https://manage.auth0.com)
2. Click "Applications" in the left sidebar
3. Click "Create Application"
4. Give your application a name (e.g., "EventMaster")
5. Select "Regular Web Applications"
6. Click "Create"

## Step 2: Configure Application Settings

After creating the application:

1. Go to the "Settings" tab of your application
2. Note down these values (you'll need them later):
   - **Domain** (e.g., `your-tenant.auth0.com`)
   - **Client ID** 
   - **Client Secret**

3. Configure the URLs:
   - **Allowed Callback URLs**: `https://your-replit-domain.replit.app/api/auth/callback`
   - **Allowed Logout URLs**: `https://your-replit-domain.replit.app`
   - **Allowed Web Origins**: `https://your-replit-domain.replit.app`

4. Click "Save Changes"

## Step 3: Set Environment Variables in Replit

Add these environment variables to your Replit project:

```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id_here
AUTH0_CLIENT_SECRET=your_client_secret_here
AUTH0_CALLBACK_URL=https://your-replit-domain.replit.app/api/auth/callback
```

### How to Add Environment Variables in Replit:

1. Click on the "Secrets" tab in the left sidebar (lock icon)
2. Add each variable:
   - Key: `AUTH0_DOMAIN`, Value: your Auth0 domain
   - Key: `AUTH0_CLIENT_ID`, Value: your Client ID
   - Key: `AUTH0_CLIENT_SECRET`, Value: your Client Secret
   - Key: `AUTH0_CALLBACK_URL`, Value: your callback URL

## Step 4: Test Auth0 Integration

1. Restart your Replit application
2. Go to `/auth` page
3. Click "Continue with Auth0" button
4. You should be redirected to Auth0 login page
5. After successful login, you'll be redirected back to your app

## Current Local Authentication

While setting up Auth0, you can use the local authentication system:

**Admin Account:**
- Email: `admin@eventmaster.com`
- Password: `admin123`

**Create New Account:**
- Use the "Sign Up" tab on the auth page
- Fill in the registration form

## Troubleshooting

### Auth0 Button Shows Error
- Verify your environment variables are correct
- Check that your Auth0 application URLs are properly configured
- Ensure your Replit domain matches the callback URL

### 401 Errors
- Check if your Client Secret is correctly set
- Verify the domain matches exactly (no trailing slash)

### Redirect Errors
- Ensure callback URL in Auth0 matches your Replit domain
- Check that the URL includes `https://`

## Optional: Customize Auth0

### Add User Metadata
You can configure Auth0 to return additional user information by:
1. Going to Actions > Flows in Auth0 Dashboard
2. Select "Login" flow
3. Add custom actions to include additional user data

### Styling
You can customize the Auth0 login page appearance in:
1. Branding > Universal Login in Auth0 Dashboard
2. Customize colors, logos, and themes

## Security Notes

- Keep your Client Secret secure and never expose it in client-side code
- Use HTTPS in production (Replit provides this automatically)
- Regularly rotate your Auth0 credentials
- Review Auth0 logs for any suspicious activity

## Next Steps

Once Auth0 is configured:
1. Test both Auth0 and local authentication
2. Consider disabling local auth in production for better security
3. Set up Auth0 rules for additional user validation if needed
4. Configure user roles and permissions in Auth0 if required