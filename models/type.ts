import { db } from "~/config";
import { Schema } from "mongoose";

const typeSchema = new Schema(
  {
    key_id: { type: String }, // KEYid
    symbol: { type: String, required: true }, // 名称
    leverage: { type: Number, required: true, default: 20 }, // 倍数
    type: { type: String, required: true, enum: ["MARKET", "LIMIT", "LIMITMARKET"], default: "MARKET" }, // LIMIT 限价单
    timeInForce: { type: String, required: true, enum: ["GTC", "IOC", "FOK", "GTX"], default: "GTC" }, // GTC - Good Till Cancel 成交为止（下单后仅有1年有效期，1年后自动取消）
    necessary: { type: Boolean, required: true, default: false }, // 必持仓
    repair: { type: Boolean, required: true, default: false }, // 仓位补全
    decrease: { type: Boolean, required: true, default: false }, // 仓位删减
    useBestPrice: { type: Boolean, required: true, default: false }, // 最佳挂单价格
    marginMode: { type: String, required: true, enum: ["ISOLATED", "CROSSED"], default: "CROSSED" } // 保证金模式
  },
  {
    timestamps: {
      createdAt: "created_at", // 使用'created_at'存储创建的日期
      updatedAt: "updated_at" // 使用'updated_at'存储更新的日期
    }
  }
);

export default db.model("Type", typeSchema);
