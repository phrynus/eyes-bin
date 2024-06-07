import { binanceConfig } from "~/config";
import models from "~/models";
import { initParams } from "./initParams";
import { BinanceApi } from "~/utils/binanceApi";

export const initKey = async (o: any) => {
  let { key, plot, params } = o;
  const keyLog = await new models.KeyLog({
    key: key,
    plot: plot,
    msg: ``,
    comment: "",
    symbol: params.symbol,
    params: params
  }).save();
  try {
    const vip = new Date(key.vip_time);
    if (vip.getTime() < Date.now()) {
      throw `权限已过期,过期时间： ${new Date(vip.getTime() + 1000 * 60 * 60 * 8).toISOString()}`;
    }
    if (!key.state) throw `账户未启动`;
    const type = await models.Type.findOne({ key_id: key._id, symbol: params.symbol });
    if (!type) throw `${params.symbol} 类型不存在`;
    keyLog.symbol_type = type;
    const symbolInfo = binanceConfig.exchangeInfo[params.symbol];
    if (!symbolInfo) throw `${params.symbol} 不在交易名单`;
    keyLog.symbol_info = symbolInfo;
    const binanceApi = new BinanceApi(key.key, key.secret);
    params = await initParams({ symbolInfo, type, key, plot, params, binanceApi, keyLog });
    //
    key.save();
    keyLog.save();
  } catch (e: any) {
    keyLog.msg = e.toString();
    keyLog.save();
    key.save();
    console.log(e);
  }
};
