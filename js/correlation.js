/* ==========================================================
   JPMC PORTFOLIO TRACKER
   Correlation Engine
========================================================== */

"use strict";

const CorrelationEngine = {

    matrix: {},

    lastUpdated: null

};

/* ==========================================
   CORRELATION BETWEEN TWO ASSETS
========================================== */

function calculateCorrelation(symbolA, symbolB) {

    const returnsA = calculateReturns(symbolA);
    const returnsB = calculateReturns(symbolB);

    if (returnsA.length === 0 || returnsB.length === 0) {

        return 0;

    }

    const size = Math.min(

        returnsA.length,

        returnsB.length

    );

    return Statistics.correlation(

        returnsA.slice(-size),

        returnsB.slice(-size)

    );

}

/* ==========================================
   BUILD MATRIX
========================================== */

function buildCorrelationMatrix() {

    const positions = getPositions();

    const matrix = {};

    positions.forEach(assetA => {

        matrix[assetA.symbol] = {};

        positions.forEach(assetB => {

            matrix[assetA.symbol][assetB.symbol] =

                calculateCorrelation(

                    assetA.symbol,

                    assetB.symbol

                );

        });

    });

    CorrelationEngine.matrix = matrix;

    CorrelationEngine.lastUpdated = Date.now();

    if (typeof publishEvent === "function") {

        publishEvent(

            "correlation:update",

            matrix

        );

    }

    return matrix;

}

/* ==========================================
   GET MATRIX
========================================== */

function getCorrelationMatrix() {

    return CorrelationEngine.matrix;

}

/* ==========================================
   DIVERSIFICATION SCORE
========================================== */

function averageCorrelation() {

    const matrix = CorrelationEngine.matrix;

    const symbols = Object.keys(matrix);

    if (symbols.length < 2) {

        return 0;

    }

    let total = 0;

    let count = 0;

    symbols.forEach(a => {

        symbols.forEach(b => {

            if (a === b) return;

            total += Math.abs(

                matrix[a][b]

            );

            count++;

        });

    });

    return count === 0 ? 0 : total / count;

}

/* ==========================================
   EXPORTS
========================================== */

window.CorrelationEngine = CorrelationEngine;

window.calculateCorrelation = calculateCorrelation;

window.buildCorrelationMatrix = buildCorrelationMatrix;

window.getCorrelationMatrix = getCorrelationMatrix;

window.averageCorrelation = averageCorrelation;