/* ==========================================================
   JPMC PORTFOLIO TRACKER
   Conditional Value at Risk (CVaR)
========================================================== */

"use strict";

/* ==========================================
   CONFIGURATION
========================================== */

const CVaREngine = {

    confidenceLevel: 0.95

};

/* ==========================================
   CALCULATE CVAR
========================================== */

function calculateCVaR(confidence = CVaREngine.confidenceLevel) {

    const returns = [...calculatePortfolioReturns()];

    if (returns.length === 0) {

        return 0;

    }

    returns.sort((a, b) => a - b);

    const cutoff = Math.floor(

        (1 - confidence) * returns.length

    );

    const tail = returns.slice(

        0,

        Math.max(1, cutoff)

    );

    const averageLoss =

        Statistics.mean(tail);

    return Math.abs(

        averageLoss *

        getPortfolioValue()

    );

}

/* ==========================================
   TAIL LOSS COUNT
========================================== */

function tailObservations(confidence = CVaREngine.confidenceLevel) {

    const returns = calculatePortfolioReturns();

    return Math.max(

        1,

        Math.floor(

            (1 - confidence) *

            returns.length

        )

    );

}

/* ==========================================
   SUMMARY
========================================== */

function cvarSummary() {

    return {

        confidence:

            CVaREngine.confidenceLevel,

        valueAtRisk:

            calculateHistoricalVaR(),

        conditionalVaR:

            calculateCVaR(),

        tailObservations:

            tailObservations()

    };

}

/* ==========================================
   EXPORTS
========================================== */

window.CVaREngine = CVaREngine;

window.calculateCVaR = calculateCVaR;

window.tailObservations = tailObservations;

window.cvarSummary = cvarSummary;