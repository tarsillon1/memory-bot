import { AxiosInstance } from "axios";
import axios from "axios";
import { MetricLog } from "../model/MetricLog";

export default class AggregatorClient {
  private readonly instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.AGGREGATOR_URL
    });
  }

  public async sendMetricLogs(metricLogs: MetricLog[]) {
    return this.instance.post(
      `/aggregator/collect?apiToken=${
        process.env.AGGREGATOR_API_TOKEN
      }&schema=com.aggregator.metric.log&strict=true`,
      {
        metricLogs
      }
    ).catch(console.log);
  }
}
