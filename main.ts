import { Hono } from "hono";
import crypto from "crypto";
import { routes } from "~/routes";
import { config } from "~/config";
import models from "~/models";

const app = new Hono();

app.route("/", routes);

export default app;

// import BigNumber from "bignumber.js";

// let p = new BigNumber(0.1);

// console.log(p.lt(0.2));

// new models.Type({
//   leverage: 50,
//   necessary: false,
//   symbol: "1000PEPEUSDT.P.P",
//   timeInForce: "GTC",
//   type: "LIMITMARKET",
//   useBestPrice: false,
//   repair: true,
//   decrease: false
// }).save();
