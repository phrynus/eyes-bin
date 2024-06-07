import { Hono } from "hono";
import crypto from "crypto";
import { routes } from "~/routes";
import { config } from "~/config";
import models from "~/models";

const app = new Hono();

app.route("/", routes);

// console.log(JSON.stringify(config.binanceConfig));
// new models.Type({
//   key_id: "666278bd65cc6a53ab7d2952",
//   symbol: "BNBUSDT.P",
//   leverage: 20,
//   type: "MARKET",
//   timeInForce: "GTC",
//   necessary: true,
//   balance: true
// }).save();

export default app;
