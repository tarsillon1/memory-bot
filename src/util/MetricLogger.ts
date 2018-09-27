import * as path from "path";
import PlatformUtil from "./PlatformUtil";
import { Log } from "../model/Log";

export default class MetricLogger {
  private static readonly LOG_STREAM_ID: string = [...Array(10)]
    .map(i => (~~(Math.random() * 36)).toString(36))
    .join("");
  private static readonly LOG_EVENTS: Map<string, string[]> = new Map();

  public static logEvents(processName: string, events: string[]) {
    this.LOG_EVENTS.set(processName, events);
  }

  public static getLogEvents(processName: string) {
    let logEvents: string[] = this.LOG_EVENTS.get(processName);
    this.LOG_EVENTS.set(processName, []);
    return logEvents;
  }

  /**
   * Create a memory metric log depending on platform.
   * @param {string} processName the name of the process to compute the memory of.
   */
  public static async logMemory(processName: string): Promise<Log> {
    switch (PlatformUtil.getPlatform()) {
      case "WIN32":
        return await this.logMemoryWindows(processName);
      case "DARWIN":
        return await this.logMemoryUnix(processName);
      case "LINUX":
        //TO-DO
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
      // On windows the process name does not contains spaces. So the process name ends at the index of the next space.
      let name = stdout.substring(0, stdout.indexOf(" ")).trim();
      stdout = stdout.substring(stdout.indexOf(" ")).trim();

      // The private working set ends before the start of the next line.
      let privateWorkingSet: number = Number.parseInt(
        stdout.substring(
          0,
          stdout.indexOf("\n") !== -1 ? stdout.indexOf("\n") : stdout.length
        )
      );
      totalPrivateWorkingSet += privateWorkingSet ? privateWorkingSet : 0;
      relatedLogs.push(
        new Log( {
          logStreamId : this.LOG_STREAM_ID,
          processName: name,
          platform: "Windows",
          metricName: "Private Working Set",
          metricValue: privateWorkingSet,
          events
        })
      );
    }

    return new Log(
      {
        logStreamId : this.LOG_STREAM_ID,
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
        new Log( {
          logStreamId : this.LOG_STREAM_ID,
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
        logStreamId : this.LOG_STREAM_ID,
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
