import AggregatorClient from "../client/AggregatorClient";
import { promisify } from "util";
import MetricLogger from "../util/MetricLogger";
import PlatformUtil from "../util/PlatformUtil";
import { Run, With } from "../util/BenchmarkRunner";
import {Log} from "../model/Log";

export default class ExecSteps {
  private aggregatorClient = new AggregatorClient();

  private CACHE_CAPACITY: number = 60;
  private logCache: Log[] = [];

  constructor() {}

  /**
   * Wait specified time.
   * @param {string} time the time to wait.
   */
  @Run("Wait")
  public async wait(@With("time") time: string) {
    await promisify(setTimeout)(ExecSteps.parseTime(time));
  }

  /**
   * Full screen specified process.
   * @param processName the name of the process to full screen.
   */
  @Run("Full Screen")
  public async fullScreen(@With("processName") processName: string) {
    await PlatformUtil.fullScreenProcess(processName);
  }

  @Run("Log Events")
  public async logEvents(
    @With("processName") processName: string,
    @With("events") events: string[]
  ) {
    MetricLogger.logEvents(processName, events);
  }

  /**
   * Log the memory of the specified process.
   * @param processName the name of the process to log memory.
   * @param {string} every the period to log the memory of the process.
   * @param {string} forTime the time to log repeat logging for.
   */
  @Run("Log Memory")
  public async logMemory(
    @With("processName") processName: string,
    @With("every") every: string,
    @With("for") forTime: string
  ) {
    let everyNum: number = ExecSteps.parseTime(every);
    let forNum: number = ExecSteps.parseTime(forTime);

    let memoryLog = async (): Promise<void> => {
      let log: Log = await MetricLogger.logMemory(processName);

      this.logCache.push(log);
      if (this.logCache.length === this.CACHE_CAPACITY) {
        await this.aggregatorClient.sendLogs(this.logCache);
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

  /**
   * Parse the time of the given string.
   * @param {string} parse the string to parse.
   * @returns {number} the time in milliseconds.
   */
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
