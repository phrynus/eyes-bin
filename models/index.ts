// 数据库模型 集合
const models = {
  Key: await import("./key").then((m) => m.default),
  Plot: await import("./plot").then((m) => m.default),
  Type: await import("./type").then((m) => m.default),
  KeyLog: await import("./keyLog").then((m) => m.default),
  PlotLog: await import("./plotLog").then((m) => m.default)
};
export default models;
