/* ==========================================================
   JPMC PORTFOLIO TRACKER
   Monte Carlo Simulation Engine
========================================================== */

"use strict";

/* ==========================================
   CONFIGURATION
========================================== */

const MonteCarloEngine = {

    simulations: 10000,

    horizon: 252,

    confidenceLevel: 0.95

};

/* ==========================================
   RANDOM NORMAL
========================================== */

function randomNormal() {

    let u = 0;
    let v = 0;

    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    return Math.sqrt(-2 * Math.log(u)) *

        Math.cos(2 * Math.PI * v);

}

/* ==========================================
   DRIFT
========================================== */

function calculateDrift() {

    const returns = calculatePortfolioReturns();

    return Statistics.mean(returns);

}

/* ==========================================
   SIMULATION
========================================== */

function runMonteCarlo() {

    const initialValue = getPortfolioValue();

    const drift = calculateDrift();

    const volatility = calculateVolatility();

    const dt = 1 / MonteCarloEngine.horizon;

    const simulations = [];

    for (let i = 0; i < MonteCarloEngine.simulations; i++) {

        let value = initialValue;

        for (let day = 0; day < MonteCarloEngine.horizon; day++) {

            const shock = randomNormal();

            value *= Math.exp(

                (drift - 0.5 * volatility * volatility) * dt +

                volatility * Math.sqrt(dt) * shock

            );

        }

        simulations.push(value);

    }

    simulations.sort((a, b) => a - b);

    return simulations;

}

/* ==========================================
   SUMMARY
========================================== */

function monteCarloSummary() {

    const results = runMonteCarlo();

    const mean = Statistics.mean(results);

    const median =

        results[Math.floor(results.length / 2)];

    const worst5 =

        Statistics.percentile(results, 0.05);

    const best95 =

        Statistics.percentile(results, 0.95);

    const lossProbability =

        results.filter(

            value => value < getPortfolioValue()

        ).length /

        results.length;

    return {

        simulations: MonteCarloEngine.simulations,

        horizon: MonteCarloEngine.horizon,

        expectedValue: mean,

        median,

        worstCase5Percent: worst5,

        bestCase95Percent: best95,

        probabilityOfLoss: lossProbability

    };

}

/* ==========================================
   EXPORTS
========================================== */

window.MonteCarloEngine = MonteCarloEngine;

window.randomNormal = randomNormal;

window.calculateDrift = calculateDrift;

window.runMonteCarlo = runMonteCarlo;

window.monteCarloSummary = monteCarloSummary;