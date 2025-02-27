import { Hono } from "hono";
import { logger } from "hono/logger";
import { tvInit } from "~/controllers/tv";
import { orderInit } from "~/controllers/order";
export const routes = new Hono();
// Add your routes here
routes.use(
  logger((message: string, ...rest: string[]) => {
    console.log(new Date().toLocaleString(), message, ...rest);
  })
);
// 中间件

// Example route
routes.post("/tv/:id", async (c) => {
  return await tvInit(c);
});
routes.post("/order/:id", async (c) => {
  return await orderInit(c);
});

routes.all("*", (c) => {
  console.log(new Date().toLocaleString(), " ", c.req);
  return c.text("© 2024 GitHub Phrynus All rights reserved. #404", { status: 404 });
});
