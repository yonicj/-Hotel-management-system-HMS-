export const appConfig = () => ({
  port: parseInt(process.env.API_PORT || '4000', 10),
  environment: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
});
