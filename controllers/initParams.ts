import models from "~/models";
import BigNumber from "bignumber.js";

export const initParams = async (o: any) => {
  const { symbolInfo, type, key, params, binanceApi, keyLog } = o;

  try {
    // const positionSide = await binanceApi._({ method: "GET", url: "/fapi/v1/positionSide/dual" });
    // if (!positionSide) {
    //   throw "请先设置持仓方向";
    // }
    const account = await binanceApi._({ method: "GET", url: "/fapi/v2/account" });
    const positions = account.positions.filter((p: any) => new BigNumber(p.positionInitialMargin).gt(0));
    // 取当前持仓
    const currentPosition = positions.find((p: any) => p.symbol === params.symbol.split(".")[0]) || { positionAmt: 0 };
    key.ac_num = positions || [];
    delete account.positions;
    key.ac_sum = { ...account, positions };
    keyLog.bin_positions = { ...account, positions: positions };
    models.Key.updateOne({ _id: key._id }, { $set: key }, { upsert: true });
    // 持仓处理
    if (!type.necessary) {
      if (params.side !== "CLOSE") {
        const types = await models.Type.find({ key_id: key._id, necessary: true });
        let _positions = positions.filter((p: any) => {
          const pos = types.find((t: any) => t.symbol === `${p.symbol}.P`);
          if (pos) return false;
          return true;
        });
        if (_positions.length > key.ac_max) throw "超出最大仓位";
      }
    }
    // 补全仓位
    if (params.side == "INCR" && type.balance && params.market_size) {
      let a = new BigNumber(params.market_size).abs();
      let b = new BigNumber(currentPosition.positionAmt).abs();
      let num = new BigNumber(0);

      // 判断 a 是否与 b 相差是否大于 10%
      if (a.div(b).gt(1.1)) {
        num = a.minus(b);
      } else if (a.div(b).lt(0.9)) {
        num = b.minus(a);
        params.action = params.action === "BUY" ? "SELL" : "BUY";
      } else {
        num = new BigNumber(params.quantity);
      }

      params.quantity = num.toNumber();
    }

    if (type.type === "MARKET") {
      //
      if (params.quantity < symbolInfo.MARKET_LOT_SIZE.minQty) throw "低于最小交易量";
      if (params.quantity > symbolInfo.MARKET_LOT_SIZE.maxQty) throw "超出最大交易量";
    } else {
      if (params.quantity < symbolInfo.LOT_SIZE.minQty) throw "低于最小交易量";
      if (params.quantity > symbolInfo.LOT_SIZE.maxQty) throw "超出最大交易量";
    }
    if (params.price < symbolInfo.PRICE_FILTER.minPrice) throw "低于最小交易价格";
    if (params.price > symbolInfo.PRICE_FILTER.maxPrice) throw "超出最大交易价格";
    //
    const bin_params: any = {
      symbol: params.symbol.split(".")[0],
      type: type.type,
      positionSide: params.position_side,
      side: params.action,
      quantity: params.quantity.toFixed(symbolInfo.quantityPrecision)
    };

    // 全部平掉
    if (params.side === "CLOSE") {
      bin_params.quantity = symbolInfo.MARKET_LOT_SIZE.maxQty.toFixed(symbolInfo.quantityPrecision);
    }
    // 限价开仓 市价平仓
    if (type.type === "LIMITMARKET") {
      if (params.side === "CLOSE" || params.side === "DECR") {
        bin_params.type = "MARKET";
      } else {
        bin_params.type = "LIMIT";
      }
    }
    // 挂单
    if (bin_params.type === "LIMIT") {
      bin_params.price = params.price.toFixed(symbolInfo.pricePrecision);
      bin_params.timeInForce = type.timeInForce;
      // 使用最佳挂单价格
      if (type.useBestPrice) {
        const bestPrice = await binanceApi._({
          method: "GET",
          url: "/fapi/v1/ticker/bookTicker",
          params: { symbol: bin_params.symbol }
        });
        let price = bin_params.side == "BUY" ? bestPrice.bidPrice : bestPrice.askPrice;
        bin_params.price = new BigNumber(price).toFixed(symbolInfo.pricePrecision);
      }
    }

    // 提前平仓
    if (params.side === "TURNUP") {
      await binanceApi._({
        method: "POST",
        url: "/fapi/v1/order",
        params: {
          symbol: bin_params.symbol,
          positionSide: "SHORT",
          side: "BUY",
          quantity: symbolInfo.MARKET_LOT_SIZE.maxQty,
          type: "MARKET",
          timeInForce: "GTC"
        }
      });
    }
    // 提前平仓
    if (params.side === "TURNDOWN") {
      await binanceApi._({
        method: "POST",
        url: "/fapi/v1/order",
        params: {
          symbol: bin_params.symbol,
          positionSide: "LONG",
          side: "SELL",
          quantity: symbolInfo.MARKET_LOT_SIZE.maxQty,
          type: "MARKET",
          timeInForce: "GTC"
        }
      });
    }
    // 更改杠杆
    binanceApi
      ._({
        method: "POST",
        url: "/fapi/v1/leverage",
        params: { symbol: bin_params.symbol, leverage: type.leverage }
      })
      .catch((e: any) => {
        console.log("更改杠杆", e.message);
      });
    // 变换逐全仓模式
    binanceApi
      ._({
        method: "POST",
        url: "/fapi/v1/marginType",
        params: { symbol: bin_params.symbol, marginType: type.marginMode }
      })
      .catch((e: any) => {
        console.log("变换逐全仓模式", e.message);
      });

    return bin_params;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
