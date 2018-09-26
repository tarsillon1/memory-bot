import AggregatorClient from "../client/AggregatorClient";
import { MetricLog } from "../model/MetricLog";
import { promisify } from "util";
import MetricLogger from "../util/MetricLogger";
import PlatformUtil from "../util/PlatformUtil";
import { Run, With } from "../util/BenchmarkRunner";

export default class ExecSteps {
  private aggregatorClient = new AggregatorClient();

  private CACHE_CAPACITY: number = 60;
  private logCache: MetricLog[] = [];

  constructor() {}

  @Run("Wait")
  public async wait(@With("time") time: string) {
    await promisify(setTimeout)(ExecSteps.parseTime(time));
  }

  @Run("Full Screen")
  public async fullScreen(@With("benchmark") application) {
    await PlatformUtil.fullScreenApplication(application);
  }

  @Run("Log Memory")
  public async logMemory(
    @With("benchmark") application,
    @With("every") every: string,
    @With("for") forTime: string
  ) {
    let everyNum: number = ExecSteps.parseTime(every);
    let forNum: number = ExecSteps.parseTime(forTime);

    let memoryLog = async (): Promise<void> => {
      let log: MetricLog = await MetricLogger.logMemory(application);

      this.logCache.push(log);
      if (this.logCache.length === this.CACHE_CAPACITY) {
        await this.aggregatorClient.sendMetricLogs(this.logCache);
        this.logCache = [];
      }
    };

    (async () => {
      let time = Date.now();
      while (time - Date.now() < forNum) {
        let beforeLog = Date.now();
        await memoryLog();

        beforeLog = Date.now() - beforeLog;
        if (beforeLog < everyNum)
          await promisify(setTimeout)(everyNum - beforeLog);
      }
    })();
  }

  private static parseTime(parse: string): number {
    let time: number = Number.parseInt(parse.substring(0, parse.length));
    switch (parse.substring(parse.length - 1)) {
      case "s":
        return time * 1000;
      case "m":
        return time * 60000;
      case "h":
        return time * 600000;
      default:
        break;
    }
  }
}
