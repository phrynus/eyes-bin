import models from "~/models";

export const initParams = async (o: any) => {
  const { symbolInfo, type, key, plot, params, binanceApi, keyLog } = o;

  try {
    const account = await binanceApi._({ method: "GET", url: "/fapi/v2/account" });
    const positions = account.positions.filter((p: any) => Number(p.positionInitialMargin) > 0);
    key.ac_num = positions;
    delete account.positions;
    key.ac_sum = account;
    keyLog.bin_positions = { ...account, positions: positions };
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
      if (params.quantity < Number(symbolInfo.MARKET_LOT_SIZE.minQty)) throw "低于最小交易量";
      if (params.quantity > Number(symbolInfo.MARKET_LOT_SIZE.maxQty)) throw "超出最大交易量";
    } else {
      if (params.quantity < Number(symbolInfo.LOT_SIZE.minQty)) throw "低于最小交易量";
      if (params.quantity > Number(symbolInfo.LOT_SIZE.maxQty)) throw "超出最大交易量";
    }
    if (params.price < Number(symbolInfo.PRICE_FILTER.tickSize)) throw "低于最小交易价格";
    if (params.price > Number(symbolInfo.PRICE_FILTER.maxPrice)) throw "超出最大交易价格";
    //
    const bin_params = {
      symbol: "",
      type: type.type,
      positionSide: params.position_side,
      side: params.side,
      quantity: params.quantity,
      timestamp: type.timestamp
    };

    return bin_params;
  } catch (e) {
    throw e;
  }
};
