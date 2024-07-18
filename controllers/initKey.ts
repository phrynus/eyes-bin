import { binanceConfig } from "~/config";
import models from "~/models";
import { initParams } from "./initParams";
import { BinanceApi } from "~/utils/binanceApi";

// 初始化关键参数函数
export const initKey = async (o: any) => {
  const { key, plot, params, body } = o;

  // 创建并保存初始日志
  const keyLog = await new models.KeyLog({
    key: key,
    plot: plot,
    msg: ``,
    comment: params.comment,
    symbol: params.symbol,
    params: params,
    body: body
  }).save();

  try {
    // 检查VIP权限是否过期
    const vip = new Date(key.vip_time);
    if (vip.getTime() < Date.now()) {
      throw `权限已过期,过期时间： ${new Date(vip.getTime() + 1000 * 60 * 60 * 8).toISOString()}`;
    }

    // 检查账户状态
    if (!key.state) throw `账户未启动`;

    // 查找交易类型
    const type = await models.Type.findOne({ key_id: key._id, symbol: params.symbol });
    if (!type) throw `${params.symbol} 类型不存在`;
    keyLog.symbol_type = type;

    // 获取交易对信息
    const symbolInfo = binanceConfig.exchangeInfo[params.symbol];
    if (!symbolInfo) throw `${params.symbol} 不在交易名单`;
    keyLog.symbol_info = symbolInfo;

    // 初始化Binance API
    const binanceApi = new BinanceApi(key.key, key.secret);

    // 初始化参数
    const bin_params = await initParams({ symbolInfo, type, key, plot, params, binanceApi, keyLog });
    keyLog.bin_params = bin_params;

    // 如果订单类型不是 "GTC"，保存日志
    if (bin_params.timeInForce && bin_params.timeInForce !== "GTC") {
      await keyLog.save();
    }

    // 发送订单请求并处理结果
    keyLog.bin_result = await binanceApi
      ._(
        {
          method: "POST",
          url: `/fapi/v1/order`,
          params: bin_params
        },
        true
      )
      .then((res: any) => {
        keyLog.msg = "ok";
        return res;
      })
      .catch((e: any) => {
        keyLog.msg = e.response?.data?.msg || e.message;
        return e.response?.data || e.message;
      });

    // 保存日志
    await keyLog.save();
    console.log(new Date().toISOString(), "ok");
  } catch (e: any) {
    // 捕获错误并保存日志
    keyLog.msg = e.toString();
    await keyLog.save();
    console.error("initKey", new Date().toISOString(), e);
  }
};
