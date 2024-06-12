import models from "~/models";
import { initTag } from "./initTag";
import { initKey } from "./initKey";
import { bins } from "~/config";

let safeRepeatList: any = [];

const repeatData = (c: any) => {
  const time: number = Date.now();
  const filteredTrades = safeRepeatList.filter((trade: any) => trade.time > time - 1000 * 60 * 10);
  // filteredTrades 里面是否有重复的交易
  const hasRepeat = filteredTrades.some((trade: any) => {
    return JSON.stringify(trade.c) == JSON.stringify(c);
  });
  if (!hasRepeat) {
    safeRepeatList.unshift({ time, c });
    return false;
  } else if (safeRepeatList.length > 1000) {
    safeRepeatList.pop();
  }
  return true;
};

export const tvInit = async (c: any) => {
  const { id } = c.req.param();
  const isJson = c.req.header("content-type").includes("application/json");
  const body = isJson ? await c.req.json() : await c.req.parseBody();

  const PlotLog = await new models.PlotLog({ plot_id: id, params: body }).save();
  try {
    if (repeatData({ id, body })) throw "重复请求";
    const binParams = await initTag(body);
    PlotLog.params = {
      binParams,
      body
    };
    const plot = await models.Plot.findOne({ mark: id });
    if (!plot) throw "策略不存在";
    PlotLog.msg = "策略初始化成功";
    PlotLog.comment = binParams.comment;
    for (let key in plot.key_id) {
      let ket;
      if (bins[key]) {
        ket = bins[key];
      } else {
        ket = await models.Key.findById(key);
      }
      if (ket) {
        models.Key.findById(key).then((k: any) => {
          bins[key] = k;
        });
        initKey({
          key: ket,
          plot,
          params: binParams,
          body
        });
      } else {
        plot.key_id = plot.key_id.filter((k: any) => k != key);
      }
    }
    await plot.save();
    PlotLog.save();
    return c.text("ok");
  } catch (e: any) {
    PlotLog.msg = e.toString();
    PlotLog.save();
    return c.text(e, 500);
  }
};
