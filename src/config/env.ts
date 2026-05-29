export function readEnv(env = process.env): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  const provider: Record<string, unknown> = {};
  const database: Record<string, unknown> = {};
  const image: Record<string, unknown> = {};

  if (env.IMGX_BASE_URL) provider.baseURL = env.IMGX_BASE_URL;
  if (env.IMGX_MODEL) provider.model = env.IMGX_MODEL;
  if (env.IMGX_API_KEY_ENV) provider.apiKeyEnv = env.IMGX_API_KEY_ENV;
  if (env.IMGX_DB_PATH) database.path = env.IMGX_DB_PATH;
  if (env.IMGX_MAX_IMAGE_MB) image.maxSizeMB = Number(env.IMGX_MAX_IMAGE_MB);

  if (Object.keys(provider).length) config.provider = provider;
  if (Object.keys(database).length) config.database = database;
  if (Object.keys(image).length) config.image = image;
  return config;
}

