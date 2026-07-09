/* ==========================================================
   JPMC PORTFOLIO TRACKER
   Markowitz Efficient Frontier Engine
========================================================== */

"use strict";

const EfficientFrontierEngine = {

    portfolios: 5000,

    minWeight: 0,

    maxWeight: 1

};

/* ==========================================
   RANDOM WEIGHTS
========================================== */

function generateWeights(count) {

    const weights = [];

    let total = 0;

    for (let i = 0; i < count; i++) {

        const value = Math.random();

        weights.push(value);

        total += value;

    }

    return weights.map(w => w / total);

}

/* ==========================================
   PORTFOLIO RETURN
========================================== */

function portfolioReturn(weights, returns) {

    return Matrix.dot(weights, returns);

}

/* ==========================================
   PORTFOLIO RISK
========================================== */

function portfolioRisk(weights, covarianceMatrix) {

    let risk = 0;

    for (let i = 0; i < weights.length; i++) {

        for (let j = 0; j < weights.length; j++) {

            risk +=

                weights[i] *

                covarianceMatrix[i][j] *

                weights[j];

        }

    }

    return Math.sqrt(risk);

}

/* ==========================================
   BUILD FRONTIER
========================================== */

function generateEfficientFrontier() {

    const positions = getPositions();

    if (positions.length === 0) {

        return [];

    }

    const returns = positions.map(position => {

        return Statistics.mean(

            calculateReturns(position.symbol)

        );

    });

    const covarianceMatrix = positions.map(a =>

        positions.map(b =>

            Statistics.covariance(

                calculateReturns(a.symbol),

                calculateReturns(b.symbol)

            )

        )

    );

    const frontier = [];

    for (

        let i = 0;

        i < EfficientFrontierEngine.portfolios;

        i++

    ) {

        const weights =

            generateWeights(

                positions.length

            );

        const expectedReturn =

            portfolioReturn(

                weights,

                returns

            );

        const risk =

            portfolioRisk(

                weights,

                covarianceMatrix

            );

        const sharpe =

            risk === 0

                ? 0

                : expectedReturn / risk;

        frontier.push({

            weights,

            return: expectedReturn,

            risk,

            sharpe

        });

    }

    frontier.sort(

        (a, b) =>

            b.sharpe - a.sharpe

    );

    return frontier;

}

/* ==========================================
   OPTIMAL PORTFOLIO
========================================== */

function optimalPortfolio() {

    const frontier =

        generateEfficientFrontier();

    return frontier.length

        ? frontier[0]

        : null;

}

/* ==========================================
   EXPORTS
========================================== */

window.EfficientFrontierEngine = EfficientFrontierEngine;

window.generateEfficientFrontier = generateEfficientFrontier;

window.optimalPortfolio = optimalPortfolio;