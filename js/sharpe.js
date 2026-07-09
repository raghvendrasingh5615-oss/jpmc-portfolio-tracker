/* ==========================================================
   JPMC PORTFOLIO TRACKER
   Sharpe Ratio Engine
========================================================== */

"use strict";

/* ==========================================
   CONFIGURATION
========================================== */

const SharpeEngine = {

    riskFreeRate: 0.05, // 5% Annual

    tradingDays: 252

};

/* ==========================================
   PORTFOLIO RETURNS
========================================== */

function calculatePortfolioReturns() {

    const history = DrawdownEngine.history;

    if (!history || history.length < 2) {

        return [];

    }

    const returns = [];

    for (let i = 1; i < history.length; i++) {

        const previous = history[i - 1].value;

        const current = history[i].value;

        if (previous <= 0) continue;

        returns.push(

            (current - previous) / previous

        );

    }

    return returns;

}

/* ==========================================
   AVERAGE RETURN
========================================== */

function calculateAverageReturn() {

    const returns = calculatePortfolioReturns();

    if (returns.length === 0) {

        return 0;

    }

    return returns.reduce(

        (sum, value) => sum + value,

        0

    ) / returns.length;

}

/* ==========================================
   SHARPE RATIO
========================================== */

function calculateSharpeRatio() {

    const avgReturn = calculateAverageReturn();

    const volatility = calculateVolatility();

    if (volatility === 0) {

        return 0;

    }

    const dailyRiskFree =

        SharpeEngine.riskFreeRate /

        SharpeEngine.tradingDays;

    const excessReturn =

        avgReturn - dailyRiskFree;

    return (

        excessReturn /

        volatility

    ) * Math.sqrt(

        SharpeEngine.tradingDays

    );

}

/* ==========================================
   CLASSIFICATION
========================================== */

function classifySharpe(value) {

    if (value < 0)

        return "Poor";

    if (value < 1)

        return "Below Average";

    if (value < 2)

        return "Good";

    if (value < 3)

        return "Excellent";

    return "Outstanding";

}

/* ==========================================
   SUMMARY
========================================== */

function sharpeSummary() {

    const ratio = calculateSharpeRatio();

    return {

        ratio,

        rating: classifySharpe(ratio),

        averageReturn: calculateAverageReturn(),

        volatility: calculateVolatility(),

        riskFreeRate: SharpeEngine.riskFreeRate

    };

}

/* ==========================================
   EXPORTS
========================================== */

window.SharpeEngine = SharpeEngine;

window.calculatePortfolioReturns = calculatePortfolioReturns;

window.calculateAverageReturn = calculateAverageReturn;

window.calculateSharpeRatio = calculateSharpeRatio;

window.classifySharpe = classifySharpe;

window.sharpeSummary = sharpeSummary;