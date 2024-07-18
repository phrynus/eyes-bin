import models from "~/models";
import { bins } from "~/config";
import { initKey } from "../initKey";
import BigNumber from "bignumber.js";
import { safeList } from "~/utils/safeList"; // 导入安全列表函数

type Position = "LONG" | "SHORT";
type Side = "OPEN" | "CLOSE" | "INCR" | "DECR" | "TURNUP" | "TURNDOWN" | "BUY" | "SELL";
type ResultType = {
  symbol: string;
  position_side: Position;
  side: Side;
  quantity: number;
  price: number;
  comment: string;
  action: string;
};

export const orderInit = async (c: any) => {
  const { id } = c.req.param();
  const isJson = c.req.header("content-type").includes("application/json");
  const body = isJson ? await c.req.json() : await c.req.parseBody();
  const PlotLog = await new models.PlotLog({ plot_id: id, params: body }).save();
  try {
    if (safeList({ id, body })) throw "重复请求";
    if (!body.symbol) throw "symbol不能为空";
    if (!body.position_size) throw "position_size不能为空";
    if (!body.side) throw "side不能为空";
    if (!body.quantity) throw "quantity不能为空";
    if (!body.comment) throw "comment不能为空";

    PlotLog.params = body;
    const plot = await models.Plot.findOne({ mark: id });
    if (!plot) throw "策略不存在";
    PlotLog.msg = "策略初始化成功";
    PlotLog.comment = body.comment;
    const binParams: ResultType = {
      symbol: body.symbol,
      position_side: body.position_size,
      side: body.side,
      quantity: new BigNumber(body.quantity).toNumber(), //交易数量
      price: new BigNumber(body.price || 0).toNumber(), //价格
      comment: body.comment,
      action: "BUY"
    };

    if (!["OPEN", "CLOSE", "INCR", "DECR", "TURNUP", "TURNDOWN"].includes(binParams.side)) throw "side 参数错误";
    if (!["LONG", "SHORT"].includes(binParams.position_side)) throw "position_side 参数错误";
    if (binParams.quantity <= 0) throw "quantity 参数错误";
    if (binParams.price <= 0) throw "price 参数错误";

    // 根据OPEN|CLOSE|INCR|DECR|TURNUP|TURNDOWN 和body.position_size来设置side
    if (binParams.side == "OPEN") {
      binParams.action = binParams.position_side == "LONG" ? "BUY" : "SELL";
    } else if (binParams.side == "CLOSE") {
      binParams.action = binParams.position_side == "LONG" ? "SELL" : "BUY";
    } else if (binParams.side == "INCR") {
      binParams.action = binParams.position_side == "LONG" ? "BUY" : "SELL";
    } else if (binParams.side == "DECR") {
      binParams.action = binParams.position_side == "LONG" ? "SELL" : "BUY";
    } else if (binParams.side == "TURNUP") {
      binParams.action = binParams.position_side == "LONG" ? "BUY" : "SELL";
    } else if (binParams.side == "TURNDOWN") {
      binParams.action = binParams.position_side == "LONG" ? "SELL" : "BUY";
    } else {
      throw "side 设置错误";
    }

    for (let key_id in plot.key_id) {
      let key;
      if (bins[key_id]) {
        key = bins[key_id];
      } else {
        key = await models.Key.findById(key_id);
      }
      if (key) {
        bins[key_id] = key;
        initKey({
          key,
          plot,
          params: binParams,
          body
        });
      } else {
        plot.key_id = plot.key_id.filter((k: any) => k != key_id);
      }
    }
    await plot.save();
    PlotLog.save();
    return c.text("ok");
  } catch (e: any) {
    PlotLog.msg = e.toString();
    PlotLog.save();
    console.error("orderInit", new Date().toISOString(), e);
    return c.text(e, 500);
  }
};
