export class PriceActionAnalyzer {
    analyzeCandlePattern(candles) {
        if (candles.length < 2) {
            return { pattern: 'Insufficient data', significance: 'Low' };
        }

        const latest = candles[candles.length - 1];
        const prev = candles[candles.length - 2];
        const bodySize = Math.abs(latest.close - latest.open);
        const totalSize = latest.high - latest.low;
        
        // Doji
        if (bodySize <= totalSize * 0.1) {
            return { pattern: 'Doji', significance: 'High' };
        }
        
        // Hammer
        const lowerShadow = Math.min(latest.open, latest.close) - latest.low;
        const upperShadow = latest.high - Math.max(latest.open, latest.close);
        if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5) {
            return { pattern: 'Hammer', significance: 'High' };
        }
        
        // Engulfing
        if (latest.close > latest.open && 
            latest.open < prev.close && 
            latest.close > prev.open) {
            return { pattern: 'Bullish Engulfing', significance: 'High' };
        }
        
        if (latest.close < latest.open && 
            latest.open > prev.close && 
            latest.close < prev.open) {
            return { pattern: 'Bearish Engulfing', significance: 'High' };
        }

        return { pattern: 'No clear pattern', significance: 'Low' };
    }

    findSupportResistance(candles) {
        if (candles.length < 5) {
            return { support: [], resistance: [] };
        }

        const prices = candles.map(c => c.close);
        const support = [];
        const resistance = [];
        
        // Simple pivot point calculation
        for (let i = 2; i < prices.length - 2; i++) {
            // Support
            if (prices[i] < prices[i-1] && prices[i] < prices[i-2] &&
                prices[i] < prices[i+1] && prices[i] < prices[i+2]) {
                support.push(prices[i]);
            }
            // Resistance
            if (prices[i] > prices[i-1] && prices[i] > prices[i-2] &&
                prices[i] > prices[i+1] && prices[i] > prices[i+2]) {
                resistance.push(prices[i]);
            }
        }

        return {
            support: [...new Set(support)].sort((a, b) => b - a).slice(0, 3),
            resistance: [...new Set(resistance)].sort((a, b) => a - b).slice(0, 3)
        };
    }

    analyzeVolume(candles) {
        if (candles.length < 5) {
            return { trend: 'Insufficient data', strength: 0 };
        }

        const volumes = candles.map(c => c.volume);
        const avgVolume = volumes.slice(-5).reduce((a, b) => a + b) / 5;
        const latestVolume = volumes[volumes.length - 1];
        const volumeRatio = latestVolume / avgVolume;
        
        return {
            trend: volumeRatio > 1.2 ? 'Increasing' :
                   volumeRatio < 0.8 ? 'Decreasing' : 'Normal',
            strength: volumeRatio
        };
    }
}