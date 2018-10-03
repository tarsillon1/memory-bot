import * as path from "path";
import PlatformUtil from "./PlatformUtil";
import { Log } from "../model/Log";
import AggregatorClient from "../client/AggregatorClient";
import { promisify } from "util";

export default class MetricLoggerUtil {
  private static readonly LOG_STREAM_ID: string = [...Array(10)]
    .map(i => (~~(Math.random() * 36)).toString(36))
    .join("");
  private static readonly LOG_EVENTS: Map<string, string[]> = new Map();

  private static readonly AGGREGATOR_CLIENT = new AggregatorClient();
  private static readonly CACHE_CAPACITY: number = 30;
  private static logCache: Log[] = [];

  public static logEvents(processName: string, events: string[]) {
    this.LOG_EVENTS.set(processName, events);
  }

  public static getLogEvents(processName: string) {
    let logEvents: string[] = this.LOG_EVENTS.get(processName);
    this.LOG_EVENTS.set(processName, []);
    return logEvents;
  }

  /**
   * Log the memory of the specified process.
   * @param processName the name of the process to log memory.
   * @param {string} every the period to log the memory of the process.
   * @param {string} forTime the time to log repeat logging for.
   * @param nameAliases aliases for process names.
   */
  public static async listenOnMemoryLogs(
    processName: string,
    every: string,
    forTime: string,
    nameAliases: { name: string; alias: string }[] = []
  ) {
    let everyNum: number = this.parseTime(every);
    let forNum: number = this.parseTime(forTime);

    let memoryLog = async (): Promise<void> => {
      let log: Log = await this.getMemoryLog(processName, nameAliases);

      this.logCache.push(log);
      if (this.logCache.length === this.CACHE_CAPACITY) {
        await this.AGGREGATOR_CLIENT.sendLogs(this.logCache);
        this.logCache = [];
      }
    };

    let time = Date.now();
    while (time - Date.now() < forNum) {
      let beforeLog = Date.now();
      await memoryLog();

      beforeLog = Date.now() - beforeLog;
      if (beforeLog < everyNum)
        await promisify(setTimeout)(everyNum - beforeLog);
    }
  }

  /**
   * Create a memory metric log depending on platform.
   * @param {string} processName the name of the process to compute the memory of.
   * @param nameAliases aliases for process names.
   */
  public static async getMemoryLog(
    processName: string,
    nameAliases: { name: string; alias: string }[] = []
  ): Promise<Log> {
    let log: any = null;
    switch (PlatformUtil.getPlatform()) {
      case "WIN32":
        log = await this.logMemoryWindows(processName);
        break;
      case "DARWIN":
        log = await this.logMemoryUnix(processName);
        break;
      case "LINUX":
        //TO-DO
        break;
    }

    for (let mappings of nameAliases) {
      if (log.fields.processName === mappings.name) {
        log.fields.processName = mappings.alias;
      }
    }

    return log;
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

  /**
   * Use Get-Process to get windows process memory. Then parse the output to fit metric log interface.
   * @param {string} processName the name of the process to compute the memory of.
   */
  private static async logMemoryWindows(processName: string): Promise<Log> {
    let { stdout } = await PlatformUtil.execute(
      `powershell.exe -ExecutionPolicy ByPass -file ${path.resolve(
        __dirname,
        "../../scripts/get-process.ps1"
      )} -processName ${processName}`
    );

    let getNext = () => {
      let index = stdout.indexOf("@{CommandLine=");
      stdout = index !== -1 ? stdout.substring(index) : null;
      return stdout;
    };
    let totalPrivateWorkingSet = 0;
    let relatedLogs: Log[] = [];
    let events: string[] = this.getLogEvents(processName);
    while (getNext()) {
      let row : string = stdout.substring(0, stdout.substring(1).indexOf("@{CommandLine=") !== -1 ? stdout.substring(1).indexOf("@{CommandLine=") + 1 : stdout.length);
      let name = stdout.substring("@{CommandLine=".length, row.lastIndexOf(" ")).trim();
      stdout = stdout.substring(row.lastIndexOf(" ")).trim();

      // The private working set ends before the start of the next line.
      let privateWorkingSet: number = Number.parseInt(stdout.substring(0, stdout.indexOf("\r") !== -1 ? stdout.indexOf("\r") : stdout.substring(stdout.lastIndexOf(" "), stdout.length)));
      totalPrivateWorkingSet += privateWorkingSet ? privateWorkingSet : 0;

      relatedLogs.push(
        new Log({
          logStreamId: this.LOG_STREAM_ID,
          processName: name,
          platform: "Windows",
          metricName: "Private Working Set",
          metricValue: privateWorkingSet,
          events
        })
      );
    }

    while (true) {}

    return new Log(
      {
        logStreamId: this.LOG_STREAM_ID,
        processName: processName,
        platform: "Windows",
        metricName: "Total Private Working Set",
        metricValue: totalPrivateWorkingSet,
        events
      },
      relatedLogs
    );
  }

  private static async logMemoryUnix(processName: string): Promise<Log> {
    let stdout: string = null;
    try {
      stdout = (await PlatformUtil.execute(
        `sh ${path.resolve(
          __dirname,
          "../../scripts/get-process.sh"
        )} ${processName}`
      )).stdout;
    } catch (e) {
      if (e.stderr) throw e;
      stdout = e.stdout;
    }

    // Find the next index of the process name.
    let getNext = () => {
      let index = stdout.toLowerCase().indexOf(processName.toLowerCase());
      stdout = index !== -1 ? stdout.substring(index) : "";
      return stdout;
    };
    let totalPrivateWorkingSet = 0;
    let relatedLogs: Log[] = [];
    let events: string[] = this.getLogEvents(processName);
    while (getNext()) {
      // Unix process contain spaces, so go to the end of the memory value, and then backtrack to the last space to find the name.
      let lastIndex = stdout.substring(0, stdout.indexOf("+")).lastIndexOf(" ");
      let name = stdout.substring(0, lastIndex).trim();
      stdout = stdout.substring(lastIndex).trim();

      // Convert a memory value to kilobytes. All memory values end with a +.
      let convert = () => {
        let full = stdout.substring(0, stdout.indexOf("+"));
        let value = Number.parseInt(full.substring(0, full.length - 1));
        switch (full.substring(full.length - 1)) {
          case "B":
            return 0;
          case "M":
            return value * 1000;
          case "G":
            return value * 1000000;
          default:
            return value;
        }
      };

      // The private working set equals private compressed memory + active memory.
      let converted = convert();
      let privateWorkingSet: number = converted ? converted : 0;
      stdout = stdout.substring(stdout.indexOf(" ")).trim();

      converted = convert();
      privateWorkingSet += converted ? converted : 0;

      totalPrivateWorkingSet += privateWorkingSet;

      relatedLogs.push(
        new Log({
          logStreamId: this.LOG_STREAM_ID,
          processName: name,
          platform: "Unix",
          metricName: "Private Working Set",
          metricValue: privateWorkingSet,
          events
        })
      );
    }

    return new Log(
      {
        logStreamId: this.LOG_STREAM_ID,
        processName: processName,
        platform: "Unix",
        metricName: "Total Private Working Set",
        metricValue: totalPrivateWorkingSet,
        events
      },
      relatedLogs
    );
  }
}
