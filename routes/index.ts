import { Hono } from "hono";
import { logger } from "hono/logger";
import { tvInit } from "~/controllers/tv";
import { oInit } from "~/controllers/o";
export const routes = new Hono();
// Add your routes here
routes.use(logger());
// 中间件

// Example route
routes.post("/tv/:id", async (c) => {
  return await tvInit(c);
});
routes.post("/o/:id", async (c) => {
  return await oInit(c);
});

routes.all("*", (c) => {
  return c.text("???", { status: 200 });
});
