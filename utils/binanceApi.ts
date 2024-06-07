import axios, { type AxiosRequestConfig } from "axios";
import { binanceConfig } from "~/config";
import crypto from "crypto";

export class BinanceApi {
  axios: any;
  key: string;
  secret: string;
  constructor(key: string, secret: string) {
    this.axios = axios.create({
      baseURL: process.env.BINANCE_API_URL
    });
    // KEY密钥
    this.key = key;
    this.secret = secret;
    const _this = this;
    this.axios.interceptors.request.use((config: any) => {
      if (!config.params) config.params = {};
      config.params.timestamp = new Date().getTime();
      const serialisedParams = Object.entries(config.params)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
      const signature = crypto.createHmac("sha256", _this.secret).update(serialisedParams).digest("hex");
      config.url = `${config.url}?${serialisedParams}&signature=${signature}`;
      config.headers = {
        "X-MBX-APIKEY": _this.key
      };
      config.params = undefined;
      return config;
    });
    this.axios.interceptors.response.use(
      (response: any) => {
        return response.data;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );
  }
  _(options: AxiosRequestConfig) {
    return this.axios(options);
  }
}
