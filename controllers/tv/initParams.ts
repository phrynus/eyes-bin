import models from "~/models";

export const initParams = async (o: any) => {
  const { symbolInfo, type, key, plot, params, binanceApi, keyLog } = o;

  try {
    // const positionSide = await binanceApi._({ method: "GET", url: "/fapi/v1/positionSide/dual" });
    // if (!positionSide) {
    //   throw "请先设置持仓方向";
    // }
    const account = await binanceApi._({ method: "GET", url: "/fapi/v2/account" });
    const positions = account.positions.filter((p: any) => Number(p.positionInitialMargin) > 0);
    // 取当前持仓
    const currentPosition = positions.find((p: any) => p.symbol === params.symbol.split(".")[0]);
    key.ac_num = positions || {};
    delete account.positions;
    key.ac_sum = account || {};
    keyLog.bin_positions = { ...account, positions: positions };
    key.save();
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
      quantity: params.quantity
    };

    // 全部平掉
    if (params.side === "CLOSE") {
      bin_params.quantity = symbolInfo.MARKET_LOT_SIZE.maxQty;
    }
    // 限价开仓 市价平仓
    if (type.type === "LIMITMARKET") {
      if (params.side === "CLOSE" || params.side === "DECR") {
        type.type = "MARKET";
      } else {
        type.type = "LIMIT";
      }
    }
    // 挂单
    if (type.type === "LIMIT") {
      bin_params.price = params.price;
      bin_params.timeInForce = params.timeInForce;
      // 使用最佳挂单价格
      if (type.useBestPrice) {
        const bestPrice = await binanceApi._({
          method: "GET",
          url: "/fapi/v1/ticker/bookTicker",
          params: { symbol: bin_params.symbol }
        });
        bin_params.price = bin_params.side == "BUY" ? bestPrice.bidPrice : bestPrice.askPrice;
      }
    }
    // 补全仓位
    if (params.side !== "TURNUP" && params.side !== "TURNDOWN" && params.side !== "OPEN" && type.balance) {
      if (currentPosition.positionAmt) {
        currentPosition.positionAmt = 0;
      }
      let a = Math.abs(params.market_size);
      let b = Math.abs(Number(currentPosition.positionAmt));
      // 判断a 是否与b 相差是否大于10%
      if (a / b > 1.1) {
        bin_params.quantity = a - b;
      } else if (a / b < 0.9) {
        bin_params.quantity = b - a;
        bin_params.side = bin_params.side === "BUY" ? "SELL" : "BUY";
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
    binanceApi._({
      method: "POST",
      url: "/fapi/v1/leverage",
      params: { symbol: bin_params.symbol, leverage: type.leverage }
    });
    // 变换逐全仓模式
    binanceApi._({
      method: "POST",
      url: "/fapi/v1/marginType",
      params: { symbol: bin_params.symbol, marginType: type.marginMode }
    });

    return bin_params;
  } catch (e) {
    throw e;
  }
};
