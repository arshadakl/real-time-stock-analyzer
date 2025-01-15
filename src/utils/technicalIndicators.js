import { TECHNICAL_INDICATORS } from '../config/constants.js';

export const calculateSMA = (prices, period = TECHNICAL_INDICATORS.SMA_PERIOD) => {
    if (prices.length < period) return null;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
};

export const calculateRSI = (prices, period = TECHNICAL_INDICATORS.RSI_PERIOD) => {
    if (prices.length < period) return null;
    
    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? -change : 0);
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

