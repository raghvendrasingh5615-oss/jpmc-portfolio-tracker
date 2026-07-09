/* ==========================================================
   JPMC PORTFOLIO TRACKER
   Beta Engine
========================================================== */

"use strict";

/* ==========================================
   BETA ENGINE
========================================== */

const BetaEngine = {

    benchmark: "^GSPC",

    tradingDays: 252

};

/* ==========================================
   COVARIANCE
========================================== */

function covariance(x, y) {

    if (!x || !y) return 0;

    if (x.length !== y.length) return 0;

    if (x.length < 2) return 0;

    const meanX =

        x.reduce((a, b) => a + b, 0) / x.length;

    const meanY =

        y.reduce((a, b) => a + b, 0) / y.length;

    let total = 0;

    for (let i = 0; i < x.length; i++) {

        total +=

            (x[i] - meanX) *

            (y[i] - meanY);

    }

    return total / (x.length - 1);

}

/* ==========================================
   VARIANCE
========================================== */

function variance(values) {

    if (!values || values.length < 2) {

        return 0;

    }

    const mean =

        values.reduce((a, b) => a + b, 0)

        / values.length;

    let total = 0;

    values.forEach(value => {

        total +=

            Math.pow(value - mean, 2);

    });

    return total / (values.length - 1);

}

/* ==========================================
   BETA
========================================== */

function calculateBeta() {

    const portfolioReturns =

        calculatePortfolioReturns();

    const benchmarkReturns =

        calculateReturns(BetaEngine.benchmark);

    if (

        portfolioReturns.length === 0 ||

        benchmarkReturns.length === 0

    ) {

        return 0;

    }

    const size = Math.min(

        portfolioReturns.length,

        benchmarkReturns.length

    );

    const p = portfolioReturns.slice(-size);

    const b = benchmarkReturns.slice(-size);

    const benchmarkVariance = variance(b);

    if (benchmarkVariance === 0) {

        return 0;

    }

    return covariance(p, b) /

        benchmarkVariance;

}

/* ==========================================
   INTERPRETATION
========================================== */

function classifyBeta(beta) {

    if (beta < 0)

        return "Negative Correlation";

    if (beta < 0.8)

        return "Defensive";

    if (beta <= 1.2)

        return "Market Neutral";

    if (beta <= 1.8)

        return "Aggressive";

    return "Highly Aggressive";

}

/* ==========================================
   SUMMARY
========================================== */

function betaSummary() {

    const beta = calculateBeta();

    return {

        beta,

        benchmark: BetaEngine.benchmark,

        classification:

            classifyBeta(beta)

    };

}

/* ==========================================
   EXPORTS
========================================== */

window.BetaEngine = BetaEngine;

window.covariance = covariance;

window.variance = variance;

window.calculateBeta = calculateBeta;

window.classifyBeta = classifyBeta;

window.betaSummary = betaSummary;