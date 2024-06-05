import crypto from "crypto";

import koa from "~/routes";
import models from "~/models";
models.Logger("Hello, World!");
koa.listen(process.env.PORT, () => {
  models.Logger("服务器启动成功 http://localhost:3000");
});
// user_id: { type: String }, // 用户id
// mark: { type: String, required: true }, // 备注
// name: { type: String, required: true }, // 名称
// state: { type: Boolean, required: true }, // 状态
// dualSide: { type: Boolean, required: true }, // 双向持仓模式
// key: { type: String, required: true }, // api key
// secret: { type: String, required: true }, // api secret
// password: { type: String, required: true }, // 密码
// exchange: { type: String, required: true, enum: ["binance", "bitgit"] }, // 交易所
// vip_time: { type: Date, required: true } // 到期时间

new models.Key({
  user_id: crypto.randomUUID(),
  mark: crypto.randomUUID(),
  name: "测试",
  state: true,
  dualSide: true,
  key: "binance",
  secret: "123456",
  password: "123456",
  exchange: "binance",
  vip_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
}).save();
