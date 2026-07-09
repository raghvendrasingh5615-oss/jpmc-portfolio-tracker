/* ==========================================================
   JPMC PORTFOLIO TRACKER
   Sortino Ratio Engine
========================================================== */

"use strict";

/* ==========================================
   CONFIGURATION
========================================== */

const SortinoEngine = {

    riskFreeRate: 0.05,

    tradingDays: 252

};

/* ==========================================
   DOWNSIDE RETURNS
========================================== */

function calculateDownsideReturns() {

    const returns = calculatePortfolioReturns();

    const downside = [];

    returns.forEach(r => {

        if (r < 0) {

            downside.push(r);

        }

    });

    return downside;

}

/* ==========================================
   DOWNSIDE DEVIATION
========================================== */

function calculateDownsideDeviation() {

    const downside = calculateDownsideReturns();

    if (downside.length === 0) {

        return 0;

    }

    const squares = downside.map(v => v * v);

    const mean =

        squares.reduce((a, b) => a + b, 0)

        / squares.length;

    return Math.sqrt(mean);

}

/* ==========================================
   SORTINO RATIO
========================================== */

function calculateSortinoRatio() {

    const avgReturn = calculateAverageReturn();

    const downsideDeviation =

        calculateDownsideDeviation();

    if (downsideDeviation === 0) {

        return 0;

    }

    const dailyRiskFree =

        SortinoEngine.riskFreeRate /

        SortinoEngine.tradingDays;

    const excessReturn =

        avgReturn - dailyRiskFree;

    return (

        excessReturn /

        downsideDeviation

    ) * Math.sqrt(

        SortinoEngine.tradingDays

    );

}

/* ==========================================
   RATING
========================================== */

function classifySortino(value) {

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

function sortinoSummary() {

    const ratio = calculateSortinoRatio();

    return {

        ratio,

        rating: classifySortino(ratio),

        downsideDeviation:

            calculateDownsideDeviation(),

        averageReturn:

            calculateAverageReturn(),

        riskFreeRate:

            SortinoEngine.riskFreeRate

    };

}

/* ==========================================
   EXPORTS
========================================== */

window.SortinoEngine = SortinoEngine;

window.calculateDownsideReturns =

    calculateDownsideReturns;

window.calculateDownsideDeviation =

    calculateDownsideDeviation;

window.calculateSortinoRatio =

    calculateSortinoRatio;

window.classifySortino =

    classifySortino;

window.sortinoSummary =

    sortinoSummary;