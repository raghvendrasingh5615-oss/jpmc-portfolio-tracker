// --- 1. STATE & LIVE MARKET ENGINE ---
let portfolio = JSON.parse(localStorage.getItem('quant_portfolio')) || [];
let chartInstance = null;

// Dynamic Market Feed
let MARKET_FEED = {
    AAPL: { currentPrice: 175.50, history: [170.2, 171.5, 169.8, 172.0, 174.1, 173.5, 172.8, 174.0, 176.2, 175.5] },
    MSFT: { currentPrice: 420.20, history: [410.0, 412.5, 408.9, 415.2, 418.0, 416.3, 419.1, 422.0, 418.5, 420.2] },
    BTC:  { currentPrice: 65000,   history: [62000, 61500, 63000, 64200, 63800, 62100, 64500, 65200, 66100, 65000] },
    ETH:  { currentPrice: 3500,    history: [3300, 3400, 3350, 3420, 3510, 3480, 3550, 3600, 3580, 3500] }
};

const RISK_FREE_RATE = 0.02;

// --- 2. QUANTATATIVE ALGORITHMS ---

// Calculate standard deviation of daily returns (Volatility)
function calculateVolatility(history) {
    if (!history || history.length < 2) return 0;
    
    let returns = [];
    for (let i = 1; i < history.length; i++) {
        returns.push((history[i] - history[i-1]) / history[i-1]);
    }
    
    let mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    let variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
    
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized
}

// Calculate Portfolio-wide aggregated risk metrics
function updateRiskMetrics() {
    let totalValue = 0;
    let weightedVolSum = 0;
    let weightedReturnSum = 0;

    portfolio.forEach(asset => {
        const marketData = MARKET_FEED[asset.ticker.toUpperCase()] || { currentPrice: asset.buyPrice, history: [asset.buyPrice] };
        const assetValue = asset.quantity * marketData.currentPrice;
        totalValue += assetValue;
        asset.marketValue = assetValue;
    });

    portfolio.forEach(asset => {
        const marketData = MARKET_FEED[asset.ticker.toUpperCase()];
        if (!marketData) return;

        const weight = totalValue > 0 ? asset.marketValue / totalValue : 0;
        const assetVol = calculateVolatility(marketData.history);
        
        const totalReturn = (marketData.currentPrice - marketData.history[0]) / marketData.history[0];
        const annualizedReturn = totalReturn * 25.2; 

        weightedVolSum += weight * assetVol;
        weightedReturnSum += weight * annualizedReturn;
    });

    const portfolioVol = weightedVolSum;
    const sharpeRatio = portfolioVol > 0 ? (weightedReturnSum - RISK_FREE_RATE) / portfolioVol : 0;

    // Value at Risk (VaR)
    const Z_SCORE = 1.645;
    const dailyVolatility = portfolioVol / Math.sqrt(252);
    const valueAtRiskDollars = totalValue * (Z_SCORE * dailyVolatility);

    // Render Metrics to UI
    document.getElementById('metric-total-value').innerText = `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('metric-volatility').innerText = `${(portfolioVol * 100).toFixed(2)}%`;
    document.getElementById('metric-sharpe').innerText = sharpeRatio.toFixed(2);
    document.getElementById('metric-var').innerText = `$${valueAtRiskDollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// --- 3. UI RENDERING ENGINES ---

function renderTable() {
    const tbody = document.getElementById('portfolio-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (portfolio.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-500 font-mono">No active positions in engine deployment. Add an asset above.</td></tr>`;
        return;
    }

    portfolio.forEach((asset, index) => {
        const feed = MARKET_FEED[asset.ticker.toUpperCase()] || { currentPrice: asset.buyPrice };
        const currentPrice = feed.currentPrice;
        const marketValue = asset.quantity * currentPrice;
        const pnlDollars = marketValue - (asset.quantity * asset.buyPrice);
        const pnlPercent = ((currentPrice - asset.buyPrice) / asset.buyPrice) * 100;
        const pnlClass = pnlDollars >= 0 ? 'text-emerald-400' : 'text-rose-500';

        tbody.innerHTML += `
            <tr class="hover:bg-slate-900/40 transition">
                <td class="p-4 font-mono font-bold text-white">${asset.ticker.toUpperCase()}</td>
                <td class="p-4 text-right font-mono">${asset.quantity.toLocaleString()}</td>
                <td class="p-4 text-right font-mono">$${Number(asset.buyPrice).toFixed(2)}</td>
                <td class="p-4 text-right font-mono text-slate-300">$${currentPrice.toFixed(2)}</td>
                <td class="p-4 text-right font-mono font-semibold text-white">$${marketValue.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td class="p-4 text-right font-mono ${pnlClass}">${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%</td>
                <td class="p-4 text-center">
                    <button onclick="removePosition(${index})" class="text-xs font-mono uppercase bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 px-2 py-1 rounded transition">Liquidate</button>
                </td>
            </tr>
        `;
    });
}

function renderChart() {
    const canvas = document.getElementById('allocationChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const labels = portfolio.map(a => a.ticker.toUpperCase());
    const data = portfolio.map(a => {
        const price = MARKET_FEED[a.ticker.toUpperCase()]?.currentPrice || a.buyPrice;
        return a.quantity * price;
    });

    if (chartInstance) chartInstance.destroy();
    if (portfolio.length === 0) return;

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
                borderWidth: 2,
                borderColor: '#0f172a'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#94a3b8', font: { family: 'monospace' } } }
            }
        }
    });
}

// --- 4. API & INTERACTION ---

async function fetchLiveCryptoData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
        const data = await response.json();
        
        if (data.bitcoin && MARKET_FEED.BTC) {
            MARKET_FEED.BTC.currentPrice = data.bitcoin.usd;
            MARKET_FEED.BTC.history = Array.from({length: 10}, () => data.bitcoin.usd * (1 + (Math.random() * 0.04 - 0.02)));
        }
        if (data.ethereum && MARKET_FEED.ETH) {
            MARKET_FEED.ETH.currentPrice = data.ethereum.usd;
            MARKET_FEED.ETH.history = Array.from({length: 10}, () => data.ethereum.usd * (1 + (Math.random() * 0.04 - 0.02)));
        }
        
        document.getElementById('last-updated').innerText = `Status: Live (API Synced)`;
        updateRiskMetrics();
        renderTable();
        renderChart();
    } catch (error) {
        console.error("API Fetch Error:", error);
    }
}

document.getElementById('position-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const ticker = document.getElementById('ticker').value.trim().toUpperCase();
    const quantity = parseFloat(document.getElementById('quantity').value);
    const buyPrice = parseFloat(document.getElementById('buy-price').value);

    if (!ticker || isNaN(quantity) || isNaN(buyPrice)) return;

    if (!MARKET_FEED[ticker]) {
        MARKET_FEED[ticker] = {
            currentPrice: buyPrice,
            history: Array.from({length: 10}, () => buyPrice * (1 + (Math.random() * 0.04 - 0.02)))
        };
    }

    const existingAssetIndex = portfolio.findIndex(a => a.ticker === ticker);
    if (existingAssetIndex > -1) {
        portfolio[existingAssetIndex] = { ticker, quantity, buyPrice };
    } else {
        portfolio.push({ ticker, quantity, buyPrice });
    }

    syncState();
    this.reset();
});

window.removePosition = function(index) {
    portfolio.splice(index, 1);
    syncState();
}

function syncState() {
    localStorage.setItem('quant_portfolio', JSON.stringify(portfolio));
    updateRiskMetrics();
    renderTable();
    renderChart();
}

document.addEventListener("DOMContentLoaded", () => {
    syncState();
    fetchLiveCryptoData();
    setInterval(fetchLiveCryptoData, 30000);
}); 