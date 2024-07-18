import models from "~/models";
import BigNumber from "bignumber.js";

// 初始化参数函数
export const initParams = async (o: any) => {
  const { symbolInfo, type, key, params, binanceApi, keyLog } = o;

  // 获取Binance API数据的辅助函数
  const getPositionData = async (url: string) => {
    const response = await binanceApi._({ method: "GET", url });
    return response;
  };

  // 验证交易量的辅助函数
  const validateQuantity = (quantity: BigNumber, minQty: BigNumber, maxQty: BigNumber, type: string) => {
    if (quantity.lt(minQty)) {
      throw `低于最小交易量 ${quantity.toString()}-${minQty.toString()}`;
    }
    if (quantity.gt(maxQty)) {
      throw `超出最大交易量 ${quantity.toString()}-${maxQty.toString()}`;
    }
  };

  try {
    // 获取持仓方向
    const { dualSidePosition } = await getPositionData("/fapi/v1/positionSide/dual");
    if (!dualSidePosition) throw "请先设置持仓方向";

    // 获取账户信息
    const account = await getPositionData("/fapi/v2/account");
    const positions = account.positions.filter((p: any) => new BigNumber(p.positionInitialMargin).gt(0));
    const currentPosition = positions.find((p: any) => p.symbol === params.symbol.split(".")[0]) || { positionAmt: 0 };

    // 更新键值对
    key.ac_num = positions || [];
    delete account.positions;
    key.ac_sum = { ...account, positions };
    keyLog.bin_positions = { ...account, positions };
    await models.Key.updateOne({ _id: key._id }, { $set: key }, { upsert: true });

    // 非必要类型的处理
    if (!type.necessary && params.side !== "CLOSE") {
      const types = await models.Type.find({ key_id: key._id, necessary: true });
      const filteredPositions = positions.filter((p: any) => !types.find((t: any) => t.symbol === `${p.symbol}.P`));
      if (filteredPositions.length > key.ac_max) throw "超出最大仓位";
    }

    // 补全或减少仓位
    if (params.side == "INCR" && (type.repair || type.decrease) && params.market_size) {
      const a = new BigNumber(params.market_size).abs();
      const b = new BigNumber(currentPosition.positionAmt).abs();
      const num = a.minus(b).abs();
      const aDivB = a.div(b);

      // 补全仓位
      if (aDivB.gt(1.1) && type.repair) params.quantity = num;
      // 减少仓位
      if (aDivB.lt(0.9) && type.decrease) {
        params.action = params.action === "BUY" ? "SELL" : "BUY";
        params.quantity = num;
      }
    }

    // 设置订单类型
    if (type.type === "LIMITMARKET") {
      type.type = params.side === "CLOSE" || params.side === "DECR" ? "MARKET" : "LIMIT";
    }

    // 转换为BigNumber
    params.quantity = new BigNumber(params.quantity);
    params.price = new BigNumber(params.price);

    // 验证交易量
    validateQuantity(
      params.quantity,
      symbolInfo[type.type === "MARKET" ? "MARKET_LOT_SIZE" : "LOT_SIZE"].minQty,
      symbolInfo[type.type === "MARKET" ? "MARKET_LOT_SIZE" : "LOT_SIZE"].maxQty,
      type.type
    );

    // 验证交易价格
    if (params.price.lt(symbolInfo.PRICE_FILTER.minPrice)) {
      throw `低于最小交易价格 ${params.quantity.toString()}-${symbolInfo.PRICE_FILTER.minPrice.toString()}`;
    }
    if (params.price.gt(symbolInfo.PRICE_FILTER.maxPrice)) {
      throw `超出最大交易价格 ${params.quantity.toString()}-${symbolInfo.PRICE_FILTER.maxPrice.toString()}`;
    }

    // 构建交易参数
    const bin_params: any = {
      symbol: params.symbol.split(".")[0],
      type: type.type,
      positionSide: params.position_side,
      side: params.action,
      quantity: params.quantity.toFixed(symbolInfo.quantityPrecision)
    };

    // 平仓处理
    if (params.side === "CLOSE") {
      bin_params.quantity = symbolInfo.MARKET_LOT_SIZE.maxQty.toFixed(symbolInfo.quantityPrecision);
    }

    // 挂单处理
    if (bin_params.type === "LIMIT") {
      bin_params.price = params.price.toFixed(symbolInfo.pricePrecision);
      bin_params.timeInForce = type.timeInForce;
      // 最优价格
      if (type.useBestPrice) {
        const bestPrice = await getPositionData("/fapi/v1/ticker/bookTicker");
        const price = bin_params.side == "BUY" ? bestPrice.bidPrice : bestPrice.askPrice;
        bin_params.price = new BigNumber(price).toFixed(symbolInfo.pricePrecision);
      }
    }

    // 提前平仓处理
    if (params.side === "TURNUP" || params.side === "TURNDOWN") {
      await binanceApi._({
        method: "POST",
        url: "/fapi/v1/order",
        params: {
          symbol: bin_params.symbol,
          positionSide: params.side === "TURNUP" ? "SHORT" : "LONG",
          side: params.side === "TURNUP" ? "BUY" : "SELL",
          quantity: symbolInfo.MARKET_LOT_SIZE.maxQty,
          type: "MARKET",
          timeInForce: "GTC"
        }
      });
    }

    // 更改杠杆
    await binanceApi
      ._({
        method: "POST",
        url: "/fapi/v1/leverage",
        params: { symbol: bin_params.symbol, leverage: type.leverage }
      })
      .catch((e: any) => console.log("更改杠杆", e.message));

    // 变换逐全仓模式
    await binanceApi
      ._({
        method: "POST",
        url: "/fapi/v1/marginType",
        params: { symbol: bin_params.symbol, marginType: type.marginMode }
      })
      .catch((e: any) => console.log("变换逐全仓模式", e.message));

    return bin_params;
  } catch (e) {
    console.error("initParams", new Date().toISOString(), e);
    throw e;
  }
};
