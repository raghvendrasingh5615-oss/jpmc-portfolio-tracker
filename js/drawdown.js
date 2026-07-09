/* ==========================================================
   JPMC PORTFOLIO TRACKER
   Drawdown Analytics Engine
========================================================== */

"use strict";

const DrawdownEngine = {

    history: []

};

/* ==========================================
   UPDATE EQUITY CURVE
========================================== */

function updateEquityCurve() {

    const value = getPortfolioValue();

    DrawdownEngine.history.push({

        timestamp: Date.now(),

        value

    });

    if (DrawdownEngine.history.length > 10000) {

        DrawdownEngine.history.shift();

    }

}

/* ==========================================
   MAXIMUM DRAWDOWN
========================================== */

function calculateMaxDrawdown() {

    const equity = DrawdownEngine.history;

    if (equity.length < 2) return 0;

    let peak = equity[0].value;

    let maxDrawdown = 0;

    for (const point of equity) {

        if (point.value > peak) {

            peak = point.value;

        }

        const drawdown =

            ((peak - point.value) / peak) * 100;

        if (drawdown > maxDrawdown) {

            maxDrawdown = drawdown;

        }

    }

    return maxDrawdown;

}

/* ==========================================
   CURRENT DRAWDOWN
========================================== */

function calculateCurrentDrawdown() {

    const equity = DrawdownEngine.history;

    if (equity.length === 0) return 0;

    let peak = equity[0].value;

    equity.forEach(point => {

        if (point.value > peak) {

            peak = point.value;

        }

    });

    const latest = equity[equity.length - 1].value;

    return ((peak - latest) / peak) * 100;

}

/* ==========================================
   PEAK EQUITY
========================================== */

function getPeakEquity() {

    if (DrawdownEngine.history.length === 0) {

        return 0;

    }

    return Math.max(

        ...DrawdownEngine.history.map(p => p.value)

    );

}

/* ==========================================
   LOWEST EQUITY
========================================== */

function getLowestEquity() {

    if (DrawdownEngine.history.length === 0) {

        return 0;

    }

    return Math.min(

        ...DrawdownEngine.history.map(p => p.value)

    );

}

/* ==========================================
   RESET
========================================== */

function resetDrawdownHistory() {

    DrawdownEngine.history = [];

}

/* ==========================================
   AUTO UPDATE
========================================== */

if (typeof subscribeEvent === "function") {

    subscribeEvent("portfolio:update", () => {

        updateEquityCurve();

    });

}

/* ==========================================
   EXPORTS
========================================== */

window.DrawdownEngine = DrawdownEngine;

window.updateEquityCurve = updateEquityCurve;

window.calculateMaxDrawdown = calculateMaxDrawdown;

window.calculateCurrentDrawdown = calculateCurrentDrawdown;

window.getPeakEquity = getPeakEquity;

window.getLowestEquity = getLowestEquity;

window.resetDrawdownHistory = resetDrawdownHistory;