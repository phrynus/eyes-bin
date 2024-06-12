import { db } from "~/config";
import { Schema } from "mongoose";

const keyLogSchema = new Schema(
  {
    key: { type: Object },
    plot: { type: Object },
    msg: { type: String },
    comment: { type: String },
    body: { type: Object },
    symbol: { type: String },
    symbol_type: { type: Object },
    symbol_info: { type: Object },
    params: { type: Object },
    bin_params: { type: Object },
    bin_result: { type: Object },
    bin_positions: { type: Object }
  },
  {
    timestamps: {
      createdAt: "created_at", // 使用'created_at'存储创建的日期
      updatedAt: "updated_at" // 使用'updated_at'存储更新的日期
    }
  }
);

export default db.model("KeyLog", keyLogSchema);
