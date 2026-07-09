

"use strict";

/* ==========================================
   PORTFOLIO WEIGHTS
========================================== */

function calculatePortfolioWeights() {

    const positions = getPositions();

    const totalValue = getPortfolioValue();

    return positions.map(position => {

        const asset = getAsset(position.symbol);

        const marketValue = asset
            ? asset.price * position.quantity
            : 0;

        return {

            symbol: position.symbol,

            quantity: position.quantity,

            marketValue,

            weight: totalValue > 0
                ? (marketValue / totalValue) * 100
                : 0

        };

    });

}

/* ==========================================
   TOTAL MARKET VALUE
========================================== */

function calculateMarketValue() {

    let total = 0;

    getPositions().forEach(position => {

        const asset = getAsset(position.symbol);

        if(asset){

            total += asset.price * position.quantity;

        }

    });

    return total;

}

/* ==========================================
   CASH %
========================================== */

function calculateCashAllocation(){

    return (

        PortfolioEngine.cash /

        getPortfolioValue()

    ) * 100;

}

/* ==========================================
   DIVERSIFICATION
========================================== */

function diversificationScore(){

    const positions = getPositions().length;

    if(positions>=20) return 100;

    return Math.min(100,positions*5);

}

/* ==========================================
   TOP HOLDING
========================================== */

function topHolding(){

    const weights = calculatePortfolioWeights();

    if(weights.length===0) return null;

    weights.sort((a,b)=>b.marketValue-a.marketValue);

    return weights[0];

}

/* ==========================================
   PORTFOLIO SUMMARY
========================================== */

function portfolioSummary(){

    return{

        totalValue:getPortfolioValue(),

        cash:PortfolioEngine.cash,

        invested:calculateMarketValue(),

        unrealizedPnL:getUnrealizedPnL(),

        cashAllocation:calculateCashAllocation(),

        diversification:diversificationScore(),

        topHolding:topHolding(),

        weights:calculatePortfolioWeights()

    };

}



window.calculatePortfolioWeights = calculatePortfolioWeights;

window.calculateMarketValue = calculateMarketValue;

window.calculateCashAllocation = calculateCashAllocation;

window.diversificationScore = diversificationScore;

window.topHolding = topHolding;

window.portfolioSummary = portfolioSummary;