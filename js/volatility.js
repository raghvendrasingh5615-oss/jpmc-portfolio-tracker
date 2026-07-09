/* ==========================================================
   JPMC PORTFOLIO TRACKER
   Portfolio Volatility Engine
========================================================== */

"use strict";

const VolatilityEngine = {

    tradingDays: 252

};

/* ==========================================
   CALCULATE DAILY RETURNS
========================================== */

function calculateReturns(symbol) {

    const history = getHistory(symbol);

    if (!history || history.length < 2) return [];

    const returns = [];

    for (let i = 1; i < history.length; i++) {

        const previous = history[i - 1].close;
        const current = history[i].close;

        if (previous <= 0) continue;

        returns.push((current - previous) / previous);

    }

    return returns;

}

/* ==========================================
   STANDARD DEVIATION
========================================== */

function standardDeviation(values) {

    if (values.length === 0) return 0;

    const mean =
        values.reduce((a, b) => a + b, 0) / values.length;

    const variance =
        values.reduce((sum, value) => {

            return sum + Math.pow(value - mean, 2);

        }, 0) / values.length;

    return Math.sqrt(variance);

}

/* ==========================================
   ANNUALIZED VOLATILITY
========================================== */

function calculateVolatility(symbol = null) {

    if (symbol) {

        const returns = calculateReturns(symbol);

        return (
            standardDeviation(returns) *
            Math.sqrt(VolatilityEngine.tradingDays)
        );

    }

    const positions = getPositions();

    if (positions.length === 0) return 0;

    let weightedVolatility = 0;

    const weights = calculatePortfolioWeights();

    weights.forEach(weight => {

        const volatility =
            calculateVolatility(weight.symbol);

        weightedVolatility +=

            (weight.weight / 100) *

            volatility;

    });

    return weightedVolatility;

}

/* ==========================================
   EXPORT
========================================== */

window.calculateReturns = calculateReturns;

window.standardDeviation = standardDeviation;

window.calculateVolatility = calculateVolatility;