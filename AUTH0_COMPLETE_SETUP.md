# Auth0 Complete Setup Guide for EventMaster

## Step 1: Create Auth0 Account and Application

1. **Sign up for Auth0**
   - Go to https://auth0.com
   - Click "Sign Up" and create a free account
   - Choose your region (preferably closest to your users)

2. **Create a New Application**
   - In your Auth0 Dashboard, click "Applications" in the sidebar
   - Click "Create Application"
   - Name: `EventMaster`
   - Type: Select "Regular Web Applications"
   - Click "Create"

## Step 2: Configure Application Settings

1. **Basic Settings**
   - Go to your application's "Settings" tab
   - Note down these values (you'll need them later):
     - **Domain** (e.g., `your-tenant.auth0.com`)
     - **Client ID** (starts with letters and numbers)
     - **Client Secret** (long string - keep this secure!)

2. **Application URIs**
   - **Allowed Callback URLs**: 
     ```
     https://your-repl-name.your-username.repl.co/api/auth/callback,
     http://localhost:5000/api/auth/callback
     ```
   - **Allowed Logout URLs**:
     ```
     https://your-repl-name.your-username.repl.co/,
     http://localhost:5000/
     ```
   - **Allowed Web Origins**:
     ```
     https://your-repl-name.your-username.repl.co,
     http://localhost:5000
     ```
   - Click "Save Changes"

## Step 3: Set Up Environment Variables

Add these secrets to your Replit project:

1. Click the "Secrets" tab in your Replit sidebar
2. Add the following secrets:

```
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id_here
AUTH0_CLIENT_SECRET=your_client_secret_here
AUTH0_BASE_URL=https://your-repl-name.your-username.repl.co
```

**Replace the values with your actual Auth0 credentials from Step 2.**

## Step 4: Configure User Management

1. **Set up user roles (optional but recommended)**
   - Go to "User Management" > "Roles"
   - Create a role called "admin"
   - You can assign this role to specific users later

2. **User Profile Settings**
   - Go to "User Management" > "Users"
   - After users sign up, you can manually assign admin roles here

## Step 5: Test the Setup

1. After adding the environment variables, your app will restart automatically
2. Try accessing the `/auth` page
3. Click "Sign In" - you should be redirected to Auth0
4. Create a test account or sign in
5. You should be redirected back to your app

## Troubleshooting

If you encounter issues:

1. **Check your URLs** - Make sure callback URLs match exactly
2. **Verify environment variables** - All four AUTH0_ variables must be set
3. **Check the console** - Look for error messages in the workflow logs
4. **Test locally first** - Use localhost URLs for initial testing

## Security Notes

- Never share your CLIENT_SECRET publicly
- Use HTTPS in production (Replit handles this automatically)
- Consider setting up custom domains for production apps

## Next Steps

Once Auth0 is working:
1. Set up user roles and permissions
2. Customize the login/signup experience
3. Add social login providers if needed
4. Configure email templates