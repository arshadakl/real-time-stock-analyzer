import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '../config/env.js';

export class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }
    async analyze(symbol, technicalData, priceData, patternData) {
        const prompt = `
        Analyze the following stock market data for ${symbol} using price action strategy:

        Current Price: $${priceData.price}
        
        Technical Analysis:
        - 20-day SMA: $${technicalData.sma20?.toFixed(2) || 'N/A'}
        - RSI: ${technicalData.rsi?.toFixed(2) || 'N/A'}
        - Volatility: ${technicalData.volatility?.toFixed(2)}%
        
        Price Action Patterns:
        - Candlestick Pattern: ${patternData.candlePattern}
        - Chart Pattern: ${patternData.chartPattern}
        - Trend Status: ${patternData.trendStatus}
        - Support Levels: ${patternData.supportLevels.join(', ')}
        - Resistance Levels: ${patternData.resistanceLevels.join(', ')}
        
        Volume Analysis:
        - Current Volume: ${priceData.volume}
        - Volume Trend: ${patternData.volumeTrend}
        
        Recent Price Movement:
        - Day High: $${priceData.high}
        - Day Low: $${priceData.low}
        - Price Change: ${technicalData.priceChange?.toFixed(2)}%

        Please provide:
        1. Current Market Position:
           - Identify if we're in a trend, range, or consolidation
           - Key support and resistance levels
           - Volume confirmation

        2. Pattern Analysis:
           - Identify any candlestick patterns
           - Chart patterns forming
           - False breakouts or fakeouts

        3. Trade Setup (if applicable):
           - Entry points with specific price levels
           - Stop-loss levels based on support/resistance
           - Take-profit targets
           - Risk-reward ratio

        4. Trading Decision:
           - Clear recommendation (Buy, Sell, or Wait)
           - Timing (Immediate or Wait for specific conditions)
           - Risk level (High, Medium, Low)

        Keep the analysis actionable and focused on current trading opportunities.`;

        const result = await this.model.generateContent(prompt);
        return result.response.text();
    }
}