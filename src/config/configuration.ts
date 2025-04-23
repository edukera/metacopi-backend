export default () => ({
  port: parseInt(process.env.PORT, 10) || 3002,
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/metacopi',
    user: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASSWORD || '',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'metacopi_jwt_secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'metacopi_refresh_secret',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  environment: process.env.NODE_ENV || 'development',
});
