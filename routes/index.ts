import Koa from "koa";
import KoaRouter from "koa-router";
import KoaLogger from "koa-logger";
import koaBody from "koa-body";
//
import tv from "./tv";
//
const koa = new Koa();
const router = new KoaRouter();
koa.use(KoaLogger());
koa.use(koaBody({ multipart: true }));
// Add more middleware here
router.use("/tv", tv.routes());
// Add more routes here
koa.use(router.routes()).use(router.allowedMethods());
// Add more routes here
export default koa;
