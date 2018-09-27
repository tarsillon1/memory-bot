import { AxiosInstance } from "axios";
import axios from "axios";
import { Log } from "../model/Log";

export default class AggregatorClient {
  private readonly instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.AGGREGATOR_URL
    });
  }

  /**
   * Send metric logs to the aggregator.
   * @param {Log[]} logs the logs to send.
   */
  public async sendLogs(logs: Log[]) {
    return this.instance
      .post(
        `/aggregator/collect?apiToken=${
          process.env.AGGREGATOR_API_TOKEN
        }&schema=com.aggregator.log.trigger&strict=true`,
        {
          logs
        }
      )
      .catch(console.log);
  }
}
