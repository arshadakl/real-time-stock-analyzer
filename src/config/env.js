import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(dirname(__dirname), '../.env') });

export const {
    GEMINI_API_KEY,
    UPSTOCK_API_KEY,
    NODE_ENV = 'development'
} = process.env;