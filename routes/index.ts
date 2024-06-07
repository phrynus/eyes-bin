import { Hono } from "hono";
import { logger } from "hono/logger";
import { tvInit } from "~/controllers/tv";
import models from "~/models";
export const routes = new Hono();
// Add your routes here
routes.use(logger());
// Example route
routes.post("/tv/:id", async (c) => {
  return await tvInit(c);
});

routes.all("*", (c) => {
  return c.text("Not Found!", { status: 404 });
});
