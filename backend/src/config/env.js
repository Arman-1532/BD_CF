const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
    PORT: z.string().default('5000'),
    DB_SERVER: z.string().min(1),
    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),
    DATABASE_URL: z.string().min(1)
});

const env = envSchema.parse(process.env);

module.exports = env;
