import { StockAnalyzer } from './src/core/StockAnalyzer.js';
import { GEMINI_API_KEY, UPSTOCK_API_KEY } from './src/config/env.js';

async function main() {
    if (!GEMINI_API_KEY || !UPSTOCK_API_KEY) {
        console.error('Please set GEMINI_API_KEY and UPSTOCK_API_KEY in .env file');
        process.exit(1);
    }

    const analyzer = new StockAnalyzer();
    await analyzer.startMonitoring(['SBIN'], true);
}

main().catch(console.error);