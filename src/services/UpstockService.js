import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { UPSTOCK_API_KEY } from '../config/env.js';

export class UpstockService {
    constructor() {
        this.config = {
            headers: {
                'Authorization': `Bearer ${UPSTOCK_API_KEY}`,
                'Accept': 'application/json'
            },
            maxBodyLength: Infinity
        };
        this.baseURL = 'https://api.upstox.com/v2';
        this.instrumentsCache = new Map();
    }

    async loadNSEData() {
        try {
            const jsonPath = path.join(process.cwd(), 'NSE.json');
            const data = await fs.readFile(jsonPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Error loading NSE data: ${error.message}`);
        }
    }

    async getInstrumentKey(symbol) {
        try {
            // Check cache first
            if (this.instrumentsCache.has(symbol)) {
                return this.instrumentsCache.get(symbol);
            }

            const nseData = await this.loadNSEData();
            const instrument = nseData.find(
                inst => inst.trading_symbol.startsWith(symbol) && 
                        inst.exchange === 'NSE' &&
                        inst.segment === 'NSE_EQ'  // Make sure it's an equity instrument
            );

            if (!instrument) {
                throw new Error(`No matching NSE equity instrument found for ${symbol}`);
            }

            const instrumentKey = instrument.instrument_key;
            this.instrumentsCache.set(symbol, instrumentKey);
            return instrumentKey;

        } catch (error) {
            throw new Error(`Error finding instrument key: ${error.message}`);
        }
    }

    async fetchStockData(symbol) {
        try {
            const instrumentKey = await this.getInstrumentKey(symbol);

            if (!instrumentKey) {
                throw new Error(`Could not find instrument key for ${symbol}`);
            }

            // Get current date
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            console.log(instrumentKey);
            
            const response = await axios({
                ...this.config,
                method: 'get',
                url: `${this.baseURL}/historical-candle/intraday/${instrumentKey}/1minute`,
                params: {
                    to_date: today,
                    from_date: today
                }
            });
            

            if (!response.data?.data?.candles?.length) {
                throw new Error(`No candle data available for ${symbol}`);
            }

            // Get the most recent candle
            const latestCandle = response.data.data.candles[response.data.data.candles.length - 1];
            
            if (!latestCandle || latestCandle.length < 6) {
                throw new Error(`Invalid candle data format for ${symbol}`);
            }

            // Store all candles for pattern analysis
            const allCandles = response.data.data.candles.map(candle => ({
                timestamp: candle[0],
                open: parseFloat(candle[1]) || 0,
                high: parseFloat(candle[2]) || 0,
                low: parseFloat(candle[3]) || 0,
                price: parseFloat(candle[4]) || 0, // Closing price
                volume: parseInt(candle[5]) || 0
            }));

            // Return both latest data and historical candles
            return {
                price: parseFloat(latestCandle[4]) || 0, // Closing price
                volume: parseInt(latestCandle[5]) || 0,
                high: parseFloat(latestCandle[2]) || 0,
                low: parseFloat(latestCandle[3]) || 0,
                timestamp: latestCandle[0] || new Date().toISOString(),
                open: parseFloat(latestCandle[1]) || 0,
                historicalCandles: allCandles // Include all candles for pattern analysis
            };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            const statusCode = error.response?.status;
            
            if (statusCode === 404) {
                throw new Error(`Stock data not available for ${symbol}. Please verify the symbol.`);
            } else if (statusCode === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            } else if (statusCode === 401) {
                throw new Error('Authentication failed. Please check your API key.');
            }
            
            throw new Error(`Error fetching data for ${symbol}: ${errorMessage}`);
        }
    }

    async getNifty50Stocks() {
        try {
            const nseData = await this.loadNSEData();
            const niftyStocks = nseData.filter(
                inst => inst.segment === 'NSE_EQ' && 
                        this.isNifty50Stock(inst.trading_symbol)
            );

            return niftyStocks.map(stock => stock.trading_symbol);
        } catch (error) {
            console.error('Error loading Nifty 50 stocks:', error);
            // Return default Nifty 50 symbols if there's an error
            return [
                'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK',
                'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BPCL', 'BHARTIARTL',
                // ... rest of Nifty 50 stocks
            ];
        }
    }

    isNifty50Stock(symbol) {
        // Add logic to identify Nifty 50 stocks from your NSE.json
        // This could be based on trading_symbol, some flag in the JSON, or other criteria
        const nifty50List = new Set([
            'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK',
            'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BPCL', 'BHARTIARTL',
            
        ]);
        return nifty50List.has(symbol);
    }
}