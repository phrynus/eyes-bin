import mongoose from "mongoose";
import axios from "axios";
import BigNumber from "bignumber.js";

if (!process.env.MONGODB_URI) throw Error("MONGODB_URI is already set!");
try {
  await mongoose.connect(process.env.MONGODB_URI || "");
} catch (error) {
  throw error;
}
process.on("SIGINT", () => {
  mongoose.connection.close();
  process.exit();
});
process.on("SIGTERM", () => {
  mongoose.connection.close();
  process.exit();
});
// 导出mongoose
export const db = mongoose.connection.useDb("bin");

// 存币安配置
export const binanceConfig = {
  exchangeInfo: await axios.get(`${process.env.BINANCE_API_URL}/fapi/v1/exchangeInfo`).then((res) => {
    let symbols = res.data.symbols.filter((s: any) => s.status === "TRADING");
    let obj: { [symbol: string]: any } = {};
    symbols.forEach((s: any) => {
      let a = s.filters.find((f: any) => f.filterType === "PRICE_FILTER");
      let b = s.filters.find((f: any) => f.filterType === "LOT_SIZE");
      let c = s.filters.find((f: any) => f.filterType === "MARKET_LOT_SIZE");
      obj[`${s.symbol}.P`] = {
        // 数量小数点位数(仅作为系统精度使用，注意同stepSize 区分）
        quantityPrecision: s.quantityPrecision,
        // 价格小数点位数(仅作为系统精度使用，注意同tickSize 区分）
        pricePrecision: s.pricePrecision,
        // 市价吃单(相对于标记价格)允许可造成的最大价格偏离比例
        marketTakeBound: s.marketTakeBound,
        // 价格限制
        PRICE_FILTER: {
          maxPrice: new BigNumber(a.maxPrice).toNumber(),
          minPrice: new BigNumber(a.minPrice).toNumber(),
          tickSize: new BigNumber(a.tickSize).toNumber()
        },
        // 数量限制
        LOT_SIZE: {
          maxQty: new BigNumber(b.maxQty).toNumber(),
          minQty: new BigNumber(b.minQty).toNumber(),
          stepSize: new BigNumber(b.stepSize).toNumber()
        },
        // 市价订单数量限制
        MARKET_LOT_SIZE: {
          maxQty: new BigNumber(c.maxQty).toNumber(),
          minQty: new BigNumber(c.minQty).toNumber(),
          stepSize: new BigNumber(c.stepSize).toNumber()
        }
      };
    });
    return obj;
  }),
  timeOffset: await axios.get(`${process.env.BINANCE_API_URL}/fapi/v1/time`).then((res) => {
    return res.data.serverTime - Date.now();
  })
};

export const config = {
  db,
  binanceConfig
};
