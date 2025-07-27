// Environment configuration with all variables moved to environment
export const config = {
  // Database
  mongodbUrl: process.env.MONGODB_URL,
  mongodbUsername: process.env.MONGODB_USERNAME,
  mongodbPassword: process.env.MONGODB_PASSWORD,
  databaseUrl: process.env.DATABASE_URL,
  
  // Email
  emailUser: process.env.EMAIL_USER || 'akshadapastambh37@gmail.com',
  emailPassword: process.env.EMAIL_PASSWORD || 'urxpqhiqtjuhmcrs',
  emailService: process.env.EMAIL_SERVICE || 'gmail',
  
  // Session
  sessionSecret: process.env.SESSION_SECRET || 'your-default-session-secret-change-in-production',
  
  // Server
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Auth0
  auth0Domain: process.env.AUTH0_DOMAIN,
  auth0ClientId: process.env.AUTH0_CLIENT_ID,
  auth0ClientSecret: process.env.AUTH0_CLIENT_SECRET,
  auth0BaseUrl: process.env.AUTH0_BASE_URL,
  
  // Demo user credentials
  demoUserEmail: process.env.DEMO_USER_EMAIL,
  demoUserPassword: process.env.DEMO_USER_PASSWORD,
  
  // Admin credentials (moved from hardcoded)
  adminEmail: process.env.ADMIN_EMAIL || 'akshadapastambh37@gmail.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Akshad@11',
};