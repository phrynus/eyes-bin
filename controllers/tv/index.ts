import models from "~/models"; // 导入数据库模型
import { initTag } from "./initTag"; // 导入标签初始化函数
import { initKey } from "../initKey"; // 导入密钥初始化函数
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
      let key = await models.Key.findById(key_id);
      if (key) {
        initKey({ key, plot, params: binParams, body });
      } else {
        // key 查找不到，删除对应的 key_id
        plot.key_id = plot.key_id.filter((k: any) => k !== key_id);
        continue; // 提前返回，不再继续后面的逻辑
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
