import { TECHNICAL_INDICATORS } from '../config/constants.js';

export class StockData {
    constructor(symbol) {
        this.symbol = symbol;
        this.historicalData = [];
    }

    addDataPoint(data) {
        this.historicalData.push({
            ...data,
            timestamp: new Date(data.timestamp).getTime()
        });
        
        if (this.historicalData.length > TECHNICAL_INDICATORS.MAX_HISTORICAL_POINTS) {
            this.historicalData.shift();
        }
    }

    getLatestData() {
        return this.historicalData[this.historicalData.length - 1];
    }

    getPrices() {
        return this.historicalData.map(d => d.price);
    }

    getCandles() {
        return this.historicalData.map(d => ({
            timestamp: d.timestamp,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.price,
            volume: d.volume
        }));
    }
}