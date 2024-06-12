import { Hono } from "hono";
import crypto from "crypto";
import { routes } from "~/routes";
import { config } from "~/config";
import models from "~/models";

const app = new Hono();

app.route("/", routes);

export default app;
