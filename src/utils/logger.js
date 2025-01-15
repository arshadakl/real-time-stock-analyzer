export class Logger {
    static log(symbol, data, analysis) {
        console.log(`\n=== ${symbol} Analysis @ ${new Date().toLocaleString()} ===`);
        
        // Check if data exists and has price
        if (data && data.price) {
            console.log(`Current Price: ₹${data.price.toFixed(2)}`);
            
            if (data.technicalData) {
                console.log('Technical Indicators:', {
                    SMA20: data.technicalData.sma20?.toFixed(2) || 'N/A',
                    RSI: data.technicalData.rsi?.toFixed(2) || 'N/A',
                    'Price Change %': data.technicalData.priceChange?.toFixed(2) || 'N/A',
                    'Volatility %': data.technicalData.volatility?.toFixed(2) || 'N/A'
                });
            }
        } else {
            console.log('No price data available');
        }

        if (analysis) {
            console.log('AI Analysis:', analysis);
        }
    }

    static error(message, error) {
        console.error(`Error: ${message}`, error?.message || error);
        if (error?.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}