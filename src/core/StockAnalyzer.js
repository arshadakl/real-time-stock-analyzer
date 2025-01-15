import { GeminiService } from '../services/GeminiService.js';
import { UpstockService } from '../services/UpstockService.js';
import { StockData } from '../models/StockData.js';
import { Logger } from '../utils/logger.js';
import { PriceActionAnalyzer } from './PriceActionAnalyzer.js';
import { UPDATE_INTERVAL } from '../config/constants.js';

export class StockAnalyzer {
    constructor() {
        this.geminiService = new GeminiService();
        this.upstockService = new UpstockService();
        this.priceActionAnalyzer = new PriceActionAnalyzer();
        this.stocks = new Map();
    }

    async startMonitoring(symbols, includeNifty = false) {
        try {
            let stocksToMonitor = [...symbols];
            
            if (includeNifty) {
                // const niftyStocks = await this.upstockService.getNifty50Stocks();
                // stocksToMonitor = [...new Set([...stocksToMonitor, ...niftyStocks])];
                stocksToMonitor = [...new Set([...stocksToMonitor])];
            }
            
            Logger.log('System', `Starting monitoring for ${stocksToMonitor.length} symbols`);
            
            for (const symbol of stocksToMonitor) {
                this.stocks.set(symbol, new StockData(symbol));
            }

            const updateData = async () => {
                for (const symbol of stocksToMonitor) {
                    try {
                        await this.updateStockData(symbol);
                        // Add rate limiting
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (error) {
                        Logger.error(`Error processing ${symbol}:`, error);
                    }
                }
            };

            // Initial update
            await updateData();
            
            // Start interval for updates
            const intervalId = setInterval(updateData, UPDATE_INTERVAL);
            return intervalId;
        } catch (error) {
            Logger.error('Error in startMonitoring:', error);
            throw error;
        }
    }

    async updateStockData(symbol) {
        try {
            const stockData = this.stocks.get(symbol);
            if (!stockData) {
                throw new Error(`No stock data found for symbol: ${symbol}`);
            }

            // Fetch new data
            const newData = await this.upstockService.fetchStockData(symbol);
            console.log('newData :',newData);
            
            // Add to historical data
            stockData.addDataPoint(newData);
            
            // Get candles data for pattern analysis
            const candles = stockData.getCandles();
            
            // Perform price action analysis
            const patternData = {
                candlePattern: candles.length >= 2 ? 
                    this.priceActionAnalyzer.analyzeCandlePattern(candles) : 
                    { pattern: 'Insufficient data', significance: 'Low' },
                supportResistance: candles.length >= 5 ?
                    this.priceActionAnalyzer.findSupportResistance(candles) :
                    { support: [], resistance: [] },
                volumeAnalysis: candles.length >= 5 ?
                    this.priceActionAnalyzer.analyzeVolume(candles) :
                    { trend: 'Insufficient data', strength: 0 }
            };

            // Calculate technical indicators
            const technicalData = this.calculateTechnicalIndicators(stockData);
            
            // Get AI analysis
            const analysis = await this.geminiService.analyze(
                symbol,
                technicalData,
                newData,
                {
                    candlePattern: patternData.candlePattern.pattern,
                    chartPattern: this.determineChartPattern(candles),
                    trendStatus: this.determineTrend(candles),
                    supportLevels: patternData.supportResistance.support,
                    resistanceLevels: patternData.supportResistance.resistance,
                    volumeTrend: patternData.volumeAnalysis.trend
                }
            );
            
            // Log the results
            Logger.log(symbol, {
                ...newData,
                technicalData,
                patternData
            }, analysis);

            return {
                symbol,
                data: newData,
                technicalData,
                patternData,
                analysis
            };
        } catch (error) {
            Logger.error(`Error updating stock data for ${symbol}:`, error);
            throw error;
        }
    }

    calculateTechnicalIndicators(stockData) {
        try {
            const prices = stockData.getPrices();
            if (!prices.length) {
                return {
                    sma20: null,
                    rsi: null,
                    priceChange: null,
                    volatility: null
                };
            }

            return {
                sma20: this.calculateSMA(prices),
                rsi: this.calculateRSI(prices),
                priceChange: this.calculatePriceChange(prices),
                volatility: this.calculateVolatility(prices)
            };
        } catch (error) {
            Logger.error('Error calculating technical indicators:', error);
            throw error;
        }
    }

    determineChartPattern(candles) {
        // Implement chart pattern recognition logic
        return 'Analyzing...'; // Placeholder
    }

    determineTrend(candles) {
        if (candles.length < 5) return 'Insufficient data';
        
        const closes = candles.map(c => c.price);
        const sma5 = this.calculateSMA(closes, 5);
        const sma20 = this.calculateSMA(closes, 20);
        
        if (!sma5 || !sma20) return 'Calculating...';
        
        if (sma5 > sma20) return 'Uptrend';
        if (sma5 < sma20) return 'Downtrend';
        return 'Sideways';
    }

    calculateSMA(prices, period = 20) {
        if (prices.length < period) return null;
        const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }

    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return null;
        
        const changes = prices.slice(1).map((price, i) => price - prices[i]);
        const gains = changes.map(change => change > 0 ? change : 0);
        const losses = changes.map(change => change < 0 ? -change : 0);
        
        const avgGain = gains.slice(-period).reduce((a, b) => a + b) / period;
        const avgLoss = losses.slice(-period).reduce((a, b) => a + b) / period;
        
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    calculatePriceChange(prices) {
        if (prices.length < 2) return 0;
        const oldPrice = prices[prices.length - 2];
        const newPrice = prices[prices.length - 1];
        return ((newPrice - oldPrice) / oldPrice) * 100;
    }

    calculateVolatility(prices, period = 20) {
        if (prices.length < period) return null;
        const returns = prices.slice(1).map((price, i) => 
            Math.log(price / prices[i])
        );
        const mean = returns.reduce((a, b) => a + b) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility
    }
}