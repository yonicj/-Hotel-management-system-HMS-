export const securityConfig = () => ({
  jwtSecret: process.env.JWT_SECRET || 'ethiopian-hotel-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
});
