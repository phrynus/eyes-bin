// 数据库模型 集合
const models = {
  Key: await import("./key").then((m) => m.default),
  Type: await import("./type").then((m) => m.default),
  Log: await import("./log").then((m) => m.default),
  Logger: async (content: string) => {
    await new models.Log({
      content,
      type: "info"
    }).save();
  },
  LoggerParam: async (param: any) => {
    await new models.Log(param).save();
  },
  LoggerError: async (param: any) => {
    await new models.Log({
      content: param,
      type: "error"
    }).save();
  }
};
export default models;
