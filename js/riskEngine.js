/* ==========================================================
   JPMC PORTFOLIO TRACKER
   Institutional Risk Engine
   ----------------------------------------------------------
   Central coordinator for all quantitative risk analytics.
========================================================== */

"use strict";

/* ==========================================
   RISK ENGINE
========================================== */

const RiskEngine = {

    metrics: {},

    initialized: false,

    lastCalculation: null

};

/* ==========================================
   INITIALIZE
========================================== */

function initializeRiskEngine() {

    if (RiskEngine.initialized) return;

    RiskEngine.initialized = true;

    console.log("Risk Engine Initialized");

}

/* ==========================================
   CALCULATE ALL RISK METRICS
========================================== */

function calculateRisk() {

    const portfolio = portfolioSummary();

    const metrics = {

        timestamp: Date.now(),

        portfolioValue: portfolio.totalValue,

        invested: portfolio.invested,

        cash: portfolio.cash,

        unrealizedPnL: portfolio.unrealizedPnL,

        diversification: portfolio.diversification,

        volatility:
            typeof calculateVolatility === "function"
                ? calculateVolatility()
                : null,

        sharpe:
            typeof calculateSharpeRatio === "function"
                ? calculateSharpeRatio()
                : null,

        sortino:
            typeof calculateSortinoRatio === "function"
                ? calculateSortinoRatio()
                : null,

        beta:
            typeof calculateBeta === "function"
                ? calculateBeta()
                : null,

        alpha:
            typeof calculateAlpha === "function"
                ? calculateAlpha()
                : null,

        maxDrawdown:
            typeof calculateMaxDrawdown === "function"
                ? calculateMaxDrawdown()
                : null,

        valueAtRisk:
            typeof calculateVaR === "function"
                ? calculateVaR()
                : null,

        conditionalVaR:
            typeof calculateCVaR === "function"
                ? calculateCVaR()
                : null

    };

    RiskEngine.metrics = metrics;

    RiskEngine.lastCalculation = Date.now();

    if (typeof publishEvent === "function") {

        publishEvent("risk:update", metrics);

    }

    return metrics;

}

/* ==========================================
   GET LAST RESULT
========================================== */

function getRiskMetrics() {

    return RiskEngine.metrics;

}

/* ==========================================
   RECALCULATE WHEN PORTFOLIO CHANGES
========================================== */

if (typeof subscribeEvent === "function") {

    subscribeEvent("portfolio:update", () => {

        calculateRisk();

    });

    subscribeEvent("market:update", () => {

        calculateRisk();

    });

}

/* ==========================================
   EXPORTS
========================================== */

window.RiskEngine = RiskEngine;

window.initializeRiskEngine = initializeRiskEngine;

window.calculateRisk = calculateRisk;

window.getRiskMetrics = getRiskMetrics;