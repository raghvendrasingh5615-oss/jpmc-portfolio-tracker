/* ==========================================================
   JPMC PORTFOLIO TRACKER
   Value at Risk (VaR) Engine
========================================================== */

"use strict";

/* ==========================================
   CONFIGURATION
========================================== */

const VaREngine = {

    confidenceLevel: 0.95,

    tradingDays: 252

};

/* ==========================================
   Z-SCORE
========================================== */

function getZScore(confidence = VaREngine.confidenceLevel) {

    switch (confidence) {

        case 0.90:
            return 1.2816;

        case 0.95:
            return 1.6449;

        case 0.99:
            return 2.3263;

        default:
            return 1.6449;

    }

}

/* ==========================================
   HISTORICAL VaR
========================================== */

function calculateHistoricalVaR(confidence = VaREngine.confidenceLevel) {

    const returns = [...calculatePortfolioReturns()];

    if (returns.length === 0) {

        return 0;

    }

    returns.sort((a, b) => a - b);

    const percentile = Math.floor(

        (1 - confidence) * returns.length

    );

    const loss = Math.abs(

        returns[Math.max(0, percentile)]

    );

    return loss * getPortfolioValue();

}

/* ==========================================
   PARAMETRIC VaR
========================================== */

function calculateParametricVaR(confidence = VaREngine.confidenceLevel) {

    const portfolioValue = getPortfolioValue();

    const volatility = calculateVolatility();

    const z = getZScore(confidence);

    return portfolioValue * volatility * z;

}

/* ==========================================
   PUBLIC API
========================================== */

function calculateVaR() {

    return {

        confidence: VaREngine.confidenceLevel,

        historical:

            calculateHistoricalVaR(),

        parametric:

            calculateParametricVaR()

    };

}

/* ==========================================
   SUMMARY
========================================== */

function varSummary() {

    const result = calculateVaR();

    return {

        confidence:

            result.confidence,

        historicalVaR:

            result.historical,

        parametricVaR:

            result.parametric,

        portfolioValue:

            getPortfolioValue()

    };

}

/* ==========================================
   EXPORTS
========================================== */

window.VaREngine = VaREngine;

window.getZScore = getZScore;

window.calculateHistoricalVaR = calculateHistoricalVaR;

window.calculateParametricVaR = calculateParametricVaR;

window.calculateVaR = calculateVaR;

window.varSummary = varSummary;