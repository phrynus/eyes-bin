import models from "~/models"; // 导入数据库模型
import { initTag } from "./initTag"; // 导入标签初始化函数
import { initKey } from "../initKey"; // 导入密钥初始化函数
import { bins } from "~/config"; // 导入配置文件中的bins
import { safeList } from "~/utils/safeList"; // 导入安全列表函数

/**
 * 初始化交易视图
 * @param c 上下文对象，包含请求和响应
 * @returns 返回响应内容
 */
export const tvInit = async (c: any): Promise<any> => {
  const { id } = c.req.param(); // 获取请求参数中的id
  const isJson = c.req.header("content-type").includes("application/json"); // 检查请求头是否包含JSON
  const body = isJson ? await c.req.json() : await c.req.parseBody(); // 解析请求体

  // 创建新的PlotLog对象并保存
  const plotLog = new models.PlotLog({ plot_id: id, params: body });
  await plotLog.save();

  try {
    // 检查请求是否重复
    if (safeList({ id, body })) throw new Error("重复请求");

    // 初始化标签参数
    const binParams = await initTag(body);
    plotLog.params = { binParams, body };

    // 查找对应的Plot对象
    const plot = await models.Plot.findOne({ mark: id });
    if (!plot) throw new Error("策略不存在");

    plotLog.msg = "策略初始化成功";
    plotLog.comment = binParams.comment;

    // 初始化密钥
    for (const key_id of plot.key_id) {
      let key = bins[key_id];
      // 判断缓存中是否有 key 或 key 已过期
      const isKeyExpired =
        !key || !key.t || Date.now() - key.t > 1000 * 60 * 60 * 2;
      // 如果 key 不存在或者过期，从数据库查找并更新时间戳
      if (isKeyExpired) {
        key = await models.Key.findById(key_id);
        if (key) {
          key.t = Date.now();
          bins[key_id] = key; // 更新缓存
        } else {
          // key 查找不到，删除对应的 key_id
          plot.key_id = plot.key_id.filter((k: any) => k !== key_id);
          continue; // 提前返回，不再继续后面的逻辑
        }
      }
      // 如果 key 存在，初始化 key
      initKey({ key, plot, params: binParams, body });
      // 再次更新 key 和时间戳
      key = await models.Key.findById(key_id);
      if (key) {
        key.t = Date.now();
        bins[key_id] = key; // 更新缓存
      }
    }

    // 保存plot和plotLog对象
    await plot.save();
    await plotLog.save();
    return c.text("ok");
  } catch (e: any) {
    plotLog.msg = e.message; // 记录错误信息
    await plotLog.save();
    console.error("tvInit", new Date().toISOString(), e);
    return c.text(e.message, 500); // 返回错误响应
  }
};
