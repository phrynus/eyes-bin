import { db } from "~/config";
import { Schema } from "mongoose";

const PlotSchema = new Schema(
  {
    user_id: { type: String, required: true }, // 用户id
    key_id: { type: Object }, // 密钥id
    name: { type: String, required: true }, // 策略名称
    mark: { type: String, required: true } // 备注
  },
  {
    timestamps: {
      createdAt: "created_at", // 使用'created_at'存储创建的日期
      updatedAt: "updated_at" // 使用'updated_at'存储上次更新的日期
    }
  }
);

export default db.model("Plot", PlotSchema);
