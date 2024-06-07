import { db } from "~/config";
import { Schema } from "mongoose";

const plotLogSchema = new Schema(
  {
    plot_id: { type: String, required: true },
    msg: { type: String },
    comment: { type: String },
    params: { type: Object }
  },
  {
    timestamps: {
      createdAt: "created_at", // 使用'created_at'存储创建的日期
      updatedAt: "updated_at" // 使用'updated_at'存储更新的日期
    }
  }
);

export default db.model("PlotLog", plotLogSchema);
