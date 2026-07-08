// --- 1. CONFIGURATION & STATE LOGIC ---
let portfolio = JSON.parse(localStorage.getItem('quant_portfolio')) || [];
let chartInstance = null;
let simChartInstance = null;

let MARKET_FEED = {
    AAPL: { currentPrice: 175.50, history: [170.2, 171.5, 169.8, 172.0, 174.1, 173.5, 172.8, 174.0, 176.2, 175.5] },
    MSFT: { currentPrice: 420.20, history: [410.0, 412.5, 408.9, 415.2, 418.0, 416.3, 419.1, 422.0, 418.5, 420.2] },
    BTC:  { currentPrice: 65000,   history: [62000, 61500, 63000, 64200, 63800, 62100, 64500, 65200, 66100, 65000] },
    ETH:  { currentPrice: 3500,    history: [3300, 3400, 3350, 3420, 3510, 3480, 3550, 3600, 3580, 3500] },
    SPY:  { currentPrice: 510.00,  history: [502, 504, 503, 506, 508, 507, 509, 511, 510, 510] } // Market Benchmark
};

const RISK_FREE_RATE = 0.02;

// --- 2. ADVANCED STOCHASTIC & RISK MATH ALGORITHMS ---

function calculateVolatility(history) {
    if (!history || history.length < 2) return 0;
    let returns = [];
    for (let i = 1; i < history.length; i++) {
        returns.push((history[i] - history[i-1]) / history[i-1]);
    }
    let mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    let variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance) * Math.sqrt(252);
}

// Calculate Asset Beta relative to S&P 500 (SPY)
function calculateBeta(assetHistory, benchmarkHistory) {
    if (!assetHistory || !benchmarkHistory || assetHistory.length < 2) return 1.0;
    
    let assetReturns = [], benchReturns = [];
    let minLength = Math.min(assetHistory.length, benchmarkHistory.length);
    
    for (let i = 1; i < minLength; i++) {
        assetReturns.push((assetHistory[i] - assetHistory[i-1]) / assetHistory[i-1]);
        benchReturns.push((benchmarkHistory[i] - benchmarkHistory[i-1]) / benchmarkHistory[i-1]);
    }
    
    let meanAsset = assetReturns.reduce((a,b)=>a+b,0)/assetReturns.length;
    let meanBench = benchReturns.reduce((a,b)=>a+b,0)/benchReturns.length;
    
    // Covariance & Benchmark Variance
    let covariance = 0, benchVariance = 0;
    for(let i=0; i<assetReturns.length; i++) {
        covariance += (assetReturns[i] - meanAsset) * (benchReturns[i] - meanBench);
        benchVariance += Math.pow(benchReturns[i] - meanBench, 2);
    }
    
    return benchVariance === 0 ? 1.0 : (covariance / (assetReturns.length - 1)) / (benchVariance / (assetReturns.length - 1));
}

// Stochastic Engine: Geometric Brownian Motion (Box-Muller Transform for Gaussian Noise)
function runMonteCarloSimulation() {
    let totalValue = portfolio.reduce((sum, asset) => sum + (asset.quantity * (MARKET_FEED[asset.ticker.toUpperCase()]?.currentPrice || asset.buyPrice)), 0);
    if (totalValue === 0) return;

    let portfolioVol = parseFloat(document.getElementById('metric-volatility').innerText) / 100;
    if(portfolioVol === 0) portfolioVol = 0.15; // Fallback baseline volatility

    const DAYS = 30;
    const PATHS = 10; // Main diagnostic render paths
    let dt = 1 / 252;
    let mu = 0.08; // Assumed baseline drift rate (8%)

    let datasets = [];
    let timelineLabels = Array.from({length: DAYS + 1}, (_, i) => `Day ${i}`);

    // Generate price trajectory forecast tracks
    for (let p = 0; p < PATHS; p++) {
        let pathData = [totalValue];
        let currentPathPrice = totalValue;

        for (let d = 1; d <= DAYS; d++) {
            // Box-Muller normal distribution calculation
            let u1 = Math.random(), u2 = Math.random();
            let randNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            
            let drift = (mu - 0.5 * Math.pow(portfolioVol, 2)) * dt;
            let shock = portfolioVol * randNormal * Math.sqrt(dt);
            currentPathPrice *= Math.exp(drift + shock);
            pathData.push(currentPathPrice);
        }

        datasets.push({
            label: `Path ${p+1}`,
            data: pathData,
            borderColor: `rgba(255, 170, 0, ${0.15 + (p * 0.08)})`,
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
        });
    }

    const ctx = document.getElementById('simulationChart').getContext('2d');
    if (simChartInstance) simChartInstance.destroy();

    simChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: timelineLabels, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'monospace', size: 9 } } },
                y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { family: 'monospace', size: 9 } } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updateRiskMetrics() {
    let totalValue = 0, weightedVolSum = 0, weightedReturnSum = 0, weightedBetaSum = 0;

    portfolio.forEach(asset => {
        const feed = MARKET_FEED[asset.ticker.toUpperCase()] || { currentPrice: asset.buyPrice, history: [asset.buyPrice] };
        totalValue += asset.quantity * feed.currentPrice;
        asset.marketValue = asset.quantity * feed.currentPrice;
    });

    portfolio.forEach(asset => {
        const feed = MARKET_FEED[asset.ticker.toUpperCase()];
        if (!feed) return;

        const weight = totalValue > 0 ? asset.marketValue / totalValue : 0;
        const assetVol = calculateVolatility(feed.history);
        const assetBeta = calculateBeta(feed.history, MARKET_FEED.SPY.history);
        
        const totalReturn = (feed.currentPrice - feed.history[0]) / feed.history[0];
        const annualizedReturn = totalReturn * 25.2;

        weightedVolSum += weight * assetVol;
        weightedReturnSum += weight * annualizedReturn;
        weightedBetaSum += weight * assetBeta;
    });

    const portfolioVol = weightedVolSum;
    const sharpeRatio = portfolioVol > 0 ? (weightedReturnSum - RISK_FREE_RATE) / portfolioVol : 0;
    const dailyVolatility = portfolioVol / Math.sqrt(252);
    const valueAtRiskDollars = totalValue * (1.645 * dailyVolatility);

    document.getElementById('metric-total-value').innerText = `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('metric-volatility').innerText = `${(portfolioVol * 100).toFixed(2)}%`;
    document.getElementById('metric-sharpe').innerText = sharpeRatio.toFixed(2);
    document.getElementById('metric-var').innerText = `$${valueAtRiskDollars.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('metric-beta').innerText = weightedBetaSum.toFixed(2);
}

// --- 3. RENDERING & DATA LIFECYCLE ---

function renderTable() {
    const tbody = document.getElementById('portfolio-table-body');
    if (!tbody) return; tbody.innerHTML = '';

    if (portfolio.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-500 font-mono">No active positions deployed.</td></tr>`;
        return;
    }

    portfolio.forEach((asset, index) => {
        const feed = MARKET_FEED[asset.ticker.toUpperCase()] || { currentPrice: asset.buyPrice };
        const marketValue = asset.quantity * feed.currentPrice;
        const pnlPercent = ((feed.currentPrice - asset.buyPrice) / asset.buyPrice) * 100;
        
        tbody.innerHTML += `
            <tr class="hover:bg-slate-900/40 transition font-mono">
                <td class="p-4 font-bold text-white">${asset.ticker.toUpperCase()}</td>
                <td class="p-4 text-right">${asset.quantity.toLocaleString()}</td>
                <td class="p-4 text-right">$${Number(asset.buyPrice).toFixed(2)}</td>
                <td class="p-4 text-right text-slate-300">$${feed.currentPrice.toFixed(2)}</td>
                <td class="p-4 text-right text-white font-semibold">$${marketValue.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td class="p-4 text-right ${pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-500'}">${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%</td>
                <td class="p-4 text-center">
                    <button onclick="removePosition(${index})" class="text-xs bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 px-2 py-1 rounded">Liquidate</button>
                </td>
            </tr>
        `;
    });
}

function renderChart() {
    const canvas = document.getElementById('allocationChart');
    if (!canvas) return;
    
    const labels = portfolio.map(a => a.ticker.toUpperCase());
    const data = portfolio.map(a => a.quantity * (MARKET_FEED[a.ticker.toUpperCase()]?.currentPrice || a.buyPrice));

    if (chartInstance) chartInstance.destroy();
    if (portfolio.length === 0) return;

    chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: ['#ffaa00', '#00ff00', '#00ffff', '#ff00ff', '#ffffff', '#8b5cf6'], borderWidth: 2, borderColor: '#000000' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { family: 'monospace' } } } } }
    });
}

async function fetchLiveCryptoData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
        const data = await response.json();
        if (data.bitcoin && MARKET_FEED.BTC) MARKET_FEED.BTC.currentPrice = data.bitcoin.usd;
        if (data.ethereum && MARKET_FEED.ETH) MARKET_FEED.ETH.currentPrice = data.ethereum.usd;
        document.getElementById('last-updated').innerText = `Status: Live Engine`;
        syncState();
    } catch (e) { console.error("Data fetch exception handled.", e); }
}

document.getElementById('position-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const ticker = document.getElementById('ticker').value.trim().toUpperCase();
    const quantity = parseFloat(document.getElementById('quantity').value);
    const buyPrice = parseFloat(document.getElementById('buy-price').value);

    if (!ticker || isNaN(quantity) || isNaN(buyPrice)) return;

    if (!MARKET_FEED[ticker]) {
        MARKET_FEED[ticker] = { currentPrice: buyPrice, history: Array.from({length: 10}, () => buyPrice * (1 + (Math.random() * 0.04 - 0.02))) };
    }

    const index = portfolio.findIndex(a => a.ticker === ticker);
    if (index > -1) portfolio[index] = { ticker, quantity, buyPrice };
    else portfolio.push({ ticker, quantity, buyPrice });

    syncState();
    this.reset();
});

window.removePosition = function(index) { portfolio.splice(index, 1); syncState(); }

function syncState() {
    localStorage.setItem('quant_portfolio', JSON.stringify(portfolio));
    updateRiskMetrics(); renderTable(); renderChart();
}

document.addEventListener("DOMContentLoaded", () => {
    syncState(); fetchLiveCryptoData(); setInterval(fetchLiveCryptoData, 60000);
}); 