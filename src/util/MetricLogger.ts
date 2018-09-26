import * as path from "path";
import { MetricLog } from "../model/MetricLog";
import PlatformUtil from "./PlatformUtil";

export default class MetricLogger {
  private static readonly LOG_STREAM_ID: string = [...Array(10)]
    .map(i => (~~(Math.random() * 36)).toString(36))
    .join("");

  public static async logMemory(name: string): Promise<MetricLog> {
    switch (PlatformUtil.getPlatform()) {
      case "WIN32":
        return await this.logMemoryWindows(name);
      case "DARWIN":
        return await this.logMemoryUnix(name);
      case "LINUX":
        //TO-DO
        break;
    }
  }

  private static async logMemoryWindows(processName: string): Promise<MetricLog> {
    let { stdout } = await PlatformUtil.execute(
      `powershell.exe -ExecutionPolicy ByPass -file ${path.resolve(
        __dirname,
        "../../scripts/get-process.ps1"
      )} -processName ${processName}`
    );

    let getNext = () => {
      let index = stdout.toLowerCase().indexOf(processName.toLowerCase());
      stdout = index !== -1 ? stdout.substring(index) : "";
      return stdout;
    };
    let totalPrivateWorkingSet = 0;
    let logTree: MetricLog[] = [];
    while (getNext()) {
      let name = stdout.substring(0, stdout.indexOf(" ")).trim();
      stdout = stdout.substring(stdout.indexOf(" ")).trim();

      let privateWorkingSet: number = Number.parseInt(
        stdout.substring(
          0,
          stdout.indexOf("\n") !== -1 ? stdout.indexOf("\n") : stdout.length
        )
      );
      totalPrivateWorkingSet += privateWorkingSet ? privateWorkingSet : 0;

      logTree.push(
        new MetricLog(
          name,
          "Windows",
          this.LOG_STREAM_ID,
          "Private Working Set",
          privateWorkingSet
        )
      );
    }

    return new MetricLog(
      processName,
      "Windows",
      this.LOG_STREAM_ID,
      "Total Private Working Set",
      totalPrivateWorkingSet,
      logTree
    );
  }

  private static async logMemoryUnix(name: string): Promise<MetricLog> {
    let stdout: string = null;
    try {
      stdout = (await PlatformUtil.execute(
        `sh ${path.resolve(__dirname, "../../scripts/get-process.sh")} ${name}`
      )).stdout;
    } catch (e) {
      if (e.stderr) throw e;
      stdout = e.stdout;
    }

    let getNext = () => {
      let index = stdout.toLowerCase().indexOf(name.toLowerCase());
      stdout = index !== -1 ? stdout.substring(index) : "";
      return stdout;
    };
    let totalPrivateWorkingSet = 0;
    let logTree: MetricLog[] = [];
    while (getNext()) {
      let lastIndex = stdout.substring(0, stdout.indexOf("+")).lastIndexOf(" ");
      let name = stdout.substring(0, lastIndex).trim();
      stdout = stdout.substring(lastIndex).trim();

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
      let converted = convert();
      let privateWorkingSet: number = converted ? converted : 0;
      stdout = stdout.substring(stdout.indexOf(" ")).trim();

      converted = convert();
      privateWorkingSet += converted ? converted : 0;

      totalPrivateWorkingSet += privateWorkingSet;

      logTree.push(
        new MetricLog(
          name,
          "Unix",
          this.LOG_STREAM_ID,
          "Private Working Set",
          privateWorkingSet
        )
      );
    }

    return new MetricLog(
      name,
      "Unix",
      this.LOG_STREAM_ID,
      "Total Private Working Set",
      totalPrivateWorkingSet,
      logTree
    );
  }
}
