/* ==========================================================
   JPMC PORTFOLIO TRACKER
   Portfolio Engine
   ----------------------------------------------------------
   Single source of truth for all portfolio information.
========================================================== */

"use strict";

const PortfolioEngine = {

    cash: 1000000,

    currency: "USD",

    holdings: {},

    transactions: [],

    history: [],

    initialized: false

};

/* ==========================================================
   INITIALIZE
========================================================== */

function initializePortfolio(){

    if(PortfolioEngine.initialized) return;

    PortfolioEngine.initialized = true;

    PortfolioEngine.holdings = {

        AAPL:{

            symbol:"AAPL",

            quantity:150,

            averagePrice:198.40

        },

        MSFT:{

            symbol:"MSFT",

            quantity:75,

            averagePrice:486.25

        },

        NVDA:{

            symbol:"NVDA",

            quantity:120,

            averagePrice:161.15

        }

    };

    publishPortfolio();

}

/* ==========================================================
   BUY
========================================================== */

function buyAsset(symbol,quantity,price){

    if(quantity<=0) return false;

    const cost = quantity*price;

    if(cost>PortfolioEngine.cash){

        console.warn("Insufficient Cash");

        return false;

    }

    PortfolioEngine.cash -= cost;

    let holding = PortfolioEngine.holdings[symbol];

    if(!holding){

        holding={

            symbol,

            quantity:0,

            averagePrice:0

        };

        PortfolioEngine.holdings[symbol]=holding;

    }

    const totalCost =

        (holding.quantity*holding.averagePrice)+cost;

    holding.quantity += quantity;

    holding.averagePrice =

        totalCost/holding.quantity;

    PortfolioEngine.transactions.push({

        type:"BUY",

        symbol,

        quantity,

        price,

        timestamp:Date.now()

    });

    publishPortfolio();

    return true;

}

/* ==========================================================
   SELL
========================================================== */

function sellAsset(symbol,quantity,price){

    const holding=PortfolioEngine.holdings[symbol];

    if(!holding) return false;

    if(quantity>holding.quantity) return false;

    holding.quantity -= quantity;

    PortfolioEngine.cash += quantity*price;

    PortfolioEngine.transactions.push({

        type:"SELL",

        symbol,

        quantity,

        price,

        timestamp:Date.now()

    });

    if(holding.quantity===0){

        delete PortfolioEngine.holdings[symbol];

    }

    publishPortfolio();

    return true;

}

/* ==========================================================
   PORTFOLIO VALUE
========================================================== */

function getPortfolioValue(){

    let total=PortfolioEngine.cash;

    Object.values(PortfolioEngine.holdings)

        .forEach(position=>{

            const asset=getAsset(position.symbol);

            if(asset){

                total +=

                    asset.price*position.quantity;

            }

        });

    return total;

}

/* ==========================================================
   UNREALIZED PNL
========================================================== */

function getUnrealizedPnL(){

    let pnl=0;

    Object.values(PortfolioEngine.holdings)

        .forEach(position=>{

            const asset=getAsset(position.symbol);

            if(asset){

                pnl +=

                (asset.price-position.averagePrice)

                *position.quantity;

            }

        });

    return pnl;

}

/* ==========================================================
   PORTFOLIO SNAPSHOT
========================================================== */

function publishPortfolio(){

    const snapshot={

        cash:PortfolioEngine.cash,

        holdings:PortfolioEngine.holdings,

        totalValue:getPortfolioValue(),

        unrealizedPnL:getUnrealizedPnL(),

        transactions:PortfolioEngine.transactions

    };

    PortfolioEngine.history.push({

        timestamp:Date.now(),

        value:snapshot.totalValue

    });

    if(typeof publishEvent==="function"){

        publishEvent(

            "portfolio:update",

            snapshot

        );

    }

}

/* ==========================================================
   HELPERS
========================================================== */

function getPortfolio(){

    return PortfolioEngine;

}

function getPositions(){

    return Object.values(

        PortfolioEngine.holdings

    );

}

/* ==========================================================
   EXPORT
========================================================== */

window.PortfolioEngine=PortfolioEngine;

window.initializePortfolio=initializePortfolio;

window.buyAsset=buyAsset;

window.sellAsset=sellAsset;

window.getPortfolio=getPortfolio;

window.getPortfolioValue=getPortfolioValue;

window.getPositions=getPositions;

window.getUnrealizedPnL=getUnrealizedPnL;