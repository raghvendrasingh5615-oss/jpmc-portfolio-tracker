

"use strict";



const OrderManager = {

    orders: [],

    trades: [],

    nextOrderId: 1

};

/* ==========================================
   ENUMS
========================================== */

const ORDER_SIDE = {

    BUY: "BUY",

    SELL: "SELL"

};

const ORDER_TYPE = {

    MARKET: "MARKET",

    LIMIT: "LIMIT",

    STOP: "STOP",

    STOP_LIMIT: "STOP_LIMIT"

};

const ORDER_STATUS = {

    NEW: "NEW",

    PENDING: "PENDING",

    PARTIALLY_FILLED: "PARTIALLY_FILLED",

    FILLED: "FILLED",

    CANCELLED: "CANCELLED",

    REJECTED: "REJECTED"

};

/* ==========================================
   CREATE ORDER
========================================== */

function placeOrder({

    symbol,

    side,

    type = ORDER_TYPE.MARKET,

    quantity,

    limitPrice = null,

    stopPrice = null

}) {

    if (!getAsset(symbol)) {

        console.warn("Unknown Symbol");

        return null;

    }

    if (quantity <= 0) {

        console.warn("Invalid Quantity");

        return null;

    }

    const order = {

        id: "ORD-" +

            String(OrderManager.nextOrderId++).padStart(6, "0"),

        symbol,

        side,

        type,

        quantity,

        remaining: quantity,

        filled: 0,

        limitPrice,

        stopPrice,

        status: ORDER_STATUS.NEW,

        createdAt: Date.now()

    };

    OrderManager.orders.push(order);

    if (typeof publishEvent === "function") {

        publishEvent("order:created", order);

    }

    executeOrder(order);

    return order;

}

/* ==========================================
   EXECUTE ORDER
========================================== */

function executeOrder(order) {

    const asset = getAsset(order.symbol);

    if (!asset) {

        order.status = ORDER_STATUS.REJECTED;

        return;

    }

    const executionPrice = asset.price;

    if (order.type === ORDER_TYPE.LIMIT) {

        if (

            order.side === ORDER_SIDE.BUY &&

            executionPrice > order.limitPrice

        ) {

            order.status = ORDER_STATUS.PENDING;

            return;

        }

        if (

            order.side === ORDER_SIDE.SELL &&

            executionPrice < order.limitPrice

        ) {

            order.status = ORDER_STATUS.PENDING;

            return;

        }

    }

    fillOrder(order, executionPrice);

}

/* ==========================================
   FILL ORDER
========================================== */

function fillOrder(order, price) {

    order.filled = order.quantity;

    order.remaining = 0;

    order.status = ORDER_STATUS.FILLED;

    if (order.side === ORDER_SIDE.BUY) {

        buyAsset(

            order.symbol,

            order.quantity,

            price

        );

    }

    if (order.side === ORDER_SIDE.SELL) {

        sellAsset(

            order.symbol,

            order.quantity,

            price

        );

    }

    const trade = {

        tradeId:

            "TRD-" +

            String(OrderManager.trades.length + 1).padStart(6, "0"),

        orderId: order.id,

        symbol: order.symbol,

        side: order.side,

        quantity: order.quantity,

        executionPrice: price,

        timestamp: Date.now()

    };

    OrderManager.trades.push(trade);

    if (typeof publishEvent === "function") {

        publishEvent("order:filled", order);

        publishEvent("trade:created", trade);

    }

}

/* ==========================================
   CANCEL ORDER
========================================== */

function cancelOrder(orderId) {

    const order = OrderManager.orders.find(

        o => o.id === orderId

    );

    if (!order) return false;

    if (order.status === ORDER_STATUS.FILLED)

        return false;

    order.status = ORDER_STATUS.CANCELLED;

    publishEvent("order:cancelled", order);

    return true;

}

/* ==========================================
   OPEN ORDERS
========================================== */

function getOpenOrders() {

    return OrderManager.orders.filter(order =>

        order.status === ORDER_STATUS.NEW ||

        order.status === ORDER_STATUS.PENDING ||

        order.status === ORDER_STATUS.PARTIALLY_FILLED

    );

}

/* ==========================================
   FILLED ORDERS
========================================== */

function getFilledOrders() {

    return OrderManager.orders.filter(order =>

        order.status === ORDER_STATUS.FILLED

    );

}

/* ==========================================
   TRADE HISTORY
========================================== */

function getTrades() {

    return OrderManager.trades;

}

/* ==========================================
   EXPORTS
========================================== */

window.OrderManager = OrderManager;

window.placeOrder = placeOrder;

window.cancelOrder = cancelOrder;

window.getOpenOrders = getOpenOrders;

window.getFilledOrders = getFilledOrders;

window.getTrades = getTrades;

window.ORDER_SIDE = ORDER_SIDE;

window.ORDER_TYPE = ORDER_TYPE;

window.ORDER_STATUS = ORDER_STATUS;