import { db } from "~/config";
import { Schema } from "mongoose";

const keySchema = new Schema(
  {
    user_id: { type: String }, // 用户id
    plot_id: { type: String }, // 策略id
    name: { type: String, required: true }, // 名称
    state: { type: Boolean, required: true }, // 状态
    dualSide: { type: Boolean, required: true }, // 双向持仓模式
    key: { type: String, required: true }, // api key
    secret: { type: String, required: true }, // api secret
    password: { type: String }, // 密码
    exchange: { type: String, required: true, enum: ["binance", "bitgit"] }, // 交易所
    vip_time: { type: Date, required: true }, // 到期时间
    ac_num: { type: Array }, // 账户数量
    ac_max: { type: Number, default: 10 }, // 账户最大持仓
    ac_sum: { type: Object } // 账户总资产
  },
  {
    timestamps: {
      createdAt: "created_at", // 使用'created_at'存储创建的日期
      updatedAt: "updated_at" // 使用'updated_at'存储上次更新的日期
    }
  }
);

export default db.model("Key", keySchema);
