export default () => ({
  // Server configuration
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',
  
  // Database configuration (if user accounts are implemented)
  database: {
    url: process.env.DATABASE_URL,
  },
  
  // JWT configuration (if authentication is implemented)
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  
  // Google OAuth (if Google Sign-In is implemented)
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  
  // Redis configuration (for job queue)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  
  // File upload configuration
  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB in bytes
    tempFileExpiry: parseInt(process.env.TEMP_FILE_EXPIRY || '3600', 10), // 1 hour in seconds
    tempDir: process.env.TEMP_DIR || 'temp',
  },
});
