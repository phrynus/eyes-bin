import models from "~/models";
import { BinanceApi } from "~/utils/binanceApi";

import { initTag } from "./initTag";
import { initKey } from "./initKey";
import { KeyObject } from "crypto";

export const tvInit = async (c: any) => {
  const { id } = c.req.param();
  const isJson = c.req.header("content-type").includes("application/json");
  const body = isJson ? await c.req.json() : await c.req.parseBody();
  const PlotLog = await new models.PlotLog({ plot_id: id, params: body }).save();
  try {
    const binParams = await initTag(body);
    PlotLog.params = binParams;
    const plot = await models.Plot.findOne({ mark: id });
    if (!plot) throw "策略不存在";
    PlotLog.msg = "策略初始化成功";
    PlotLog.comment = JSON.stringify(plot);
    for (let key in plot.key_id) {
      initKey({
        key: await models.Key.findById(key),
        plot,
        params: binParams
      });
    }
    PlotLog.save();
    return c.text("ok");
  } catch (e: any) {
    PlotLog.msg = e.toString();
    PlotLog.save();
    return c.text(e, 500);
  }
};
