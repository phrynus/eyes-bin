import { db } from "~/config";
import { Schema } from "mongoose";

const typeSchema = new Schema(
  {
    key_id: { type: String }, // 策略id
    symbol: { type: String, required: true }, // 名称
    leverage: { type: Number, required: true }, // 倍数
    type: { type: String, required: true, enum: ["MARKET", "LIMIT"] }, // LIMIT 限价单
    timeInForce: { type: String, required: true, enum: ["GTC", "IOC", "FOK", "GTX", "GTD"] }, // GTC - Good Till Cancel 成交为止（下单后仅有1年有效期，1年后自动取消）
    necessary: { type: Boolean, required: true }, // 必持仓
    balance: { type: Boolean, required: true } // 补全策略数量
  },
  {
    timestamps: {
      createdAt: "created_at" // 使用'created_at'存储创建的日期
    }
  }
);

export default db.model("Type", typeSchema);
