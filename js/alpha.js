/* ==========================================================
   JPMC PORTFOLIO TRACKER
   Jensen's Alpha Engine
========================================================== */

"use strict";

/* ==========================================
   CONFIGURATION
========================================== */

const AlphaEngine = {

    riskFreeRate: 0.05,

    tradingDays: 252

};

/* ==========================================
   BENCHMARK RETURN
========================================== */

function calculateBenchmarkReturn() {

    const benchmarkReturns = calculateReturns(

        BetaEngine.benchmark

    );

    if (benchmarkReturns.length === 0) {

        return 0;

    }

    return Statistics.mean(benchmarkReturns);

}

/* ==========================================
   PORTFOLIO RETURN
========================================== */

function calculatePortfolioReturn() {

    return calculateAverageReturn();

}

/* ==========================================
   EXPECTED RETURN (CAPM)
========================================== */

function calculateExpectedReturn() {

    const rf =

        AlphaEngine.riskFreeRate /

        AlphaEngine.tradingDays;

    const beta = calculateBeta();

    const marketReturn =

        calculateBenchmarkReturn();

    return rf +

        beta *

        (marketReturn - rf);

}

/* ==========================================
   JENSEN'S ALPHA
========================================== */

function calculateAlpha() {

    return (

        calculatePortfolioReturn() -

        calculateExpectedReturn()

    );

}

/* ==========================================
   CLASSIFICATION
========================================== */

function classifyAlpha(alpha) {

    if (alpha > 0.02)

        return "Strong Outperformance";

    if (alpha > 0)

        return "Outperforming";

    if (alpha === 0)

        return "Market Performing";

    if (alpha > -0.02)

        return "Underperforming";

    return "Significant Underperformance";

}

/* ==========================================
   SUMMARY
========================================== */

function alphaSummary() {

    const alpha = calculateAlpha();

    return {

        alpha,

        expectedReturn:

            calculateExpectedReturn(),

        actualReturn:

            calculatePortfolioReturn(),

        benchmarkReturn:

            calculateBenchmarkReturn(),

        beta:

            calculateBeta(),

        classification:

            classifyAlpha(alpha)

    };

}

/* ==========================================
   EXPORTS
========================================== */

window.AlphaEngine = AlphaEngine;

window.calculateBenchmarkReturn =

    calculateBenchmarkReturn;

window.calculatePortfolioReturn =

    calculatePortfolioReturn;

window.calculateExpectedReturn =

    calculateExpectedReturn;

window.calculateAlpha =

    calculateAlpha;

window.classifyAlpha =

    classifyAlpha;

window.alphaSummary =

    alphaSummary;