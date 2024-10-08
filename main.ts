import { Hono } from "hono";
import crypto from "crypto";
import { routes } from "~/routes";
import { config } from "~/config";
import models from "~/models";
import axios from "axios";
import BigNumber from "bignumber.js";

// const app = new Hono();

// app.route("/", routes);

// export default app;

type exchangeInfo = {
  lever: {
    max: number; // 最大杠杆
    min: number; // 最小杠杆
  };
  qty: {
    max: number; // 最大数量
    min: number; // 最小数量
  };
  price: {
    max: number; // 最大价格
    min: number; // 最小价格
  };
  place: {
    volume: number; // 数量小数位
    price: number; // 价格小数位
  };
};

await axios.get(`https://api.bitget.com/api/v2/mix/market/contracts?productType=usdt-futures`).then((res) => {
  let symbols = res.data.data.filter((s: any) => s.symbolStatus === "normal");
  let obj: { [symbol: string]: exchangeInfo } = {};
  symbols.forEach((s: any) => {
    obj[`${s.symbol}.P`] = {
      lever: {
        max: new BigNumber(s.maxLever).toNumber(),
        min: new BigNumber(s.minLever).toNumber()
      },
      qty: {
        max: new BigNumber(-1).toNumber(),
        min: new BigNumber(s.minTradeNum).toNumber()
      },
      price: {
        max: new BigNumber(-1).toNumber(),
        min: new BigNumber(-1).toNumber()
      },
      place: {
        volume: s.volumePlace,
        price: s.pricePlace
      }
    };
  });
  return obj;
});
await axios.get(`https://fapi.binance.com/fapi/v1/exchangeInfo`).then((res) => {
  let symbols = res.data.symbols.filter((s: any) => s.status === "TRADING");
  let obj: { [symbol: string]: exchangeInfo } = {};
  symbols.forEach((s: any) => {
    let a = s.filters.find((f: any) => f.filterType === "PRICE_FILTER");
    let b = s.filters.find((f: any) => f.filterType === "LOT_SIZE");
    let c = s.filters.find((f: any) => f.filterType === "MARKET_LOT_SIZE");
    obj[`${s.symbol}.P`] = {
      lever: {
        max: new BigNumber(-1).toNumber(),
        min: new BigNumber(1).toNumber()
      },
      qty: {
        max: new BigNumber(b.maxQty).toNumber(),
        min: new BigNumber(b.minQty).toNumber()
      },
      price: {
        max: new BigNumber(a.maxPrice).toNumber(),
        min: new BigNumber(a.minPrice).toNumber()
      },
      place: {
        volume: new BigNumber(b.stepSize).dp() || 0,
        price: new BigNumber(a.stepSize).dp() || 0
      }
    };
  });
  return obj;
});
