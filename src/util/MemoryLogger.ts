import * as path from "path";
import * as util from "util";
import * as childProcess from "child_process";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { promisify } from "util";
import { Static } from "../model/AppDecorator";
import { MemoryLog } from "../model/MemoryLog";

@Static
export default class MemoryLogger {
  private static readonly LOG_STREAM_ID: string = "test";
  private static readonly exec = util.promisify(childProcess.exec);
  private static processNames: string[];

  public static initialize() {
    dotenv.config();
    this.processNames = JSON.parse(process.env.PROCESS_NAMES);

    let platform = process.platform;
    console.log(`This platform is ${platform}.`);

    let saveData = (name: string, log: MemoryLog) => {
      let original = fs.existsSync(`${name}.out`)
        ? fs.readFileSync(`${name}.out`, "utf-8").slice(0, -1)
        : "[";
      fs.writeFileSync(
        `${name}.out`,
        `${original}${original === "[" ? "" : ","}\n${JSON.stringify(log, null, 4)}]`,
        "utf-8"
      );
    };

    let memoryLog = async () => {
      for (let name of this.processNames) {
        let log: MemoryLog = null;
        switch (platform.toUpperCase()) {
          case "WIN32":
            log = await MemoryLogger.logWindows(name);
            saveData(name, log);
            break;
          case "DARWIN":
            log = await MemoryLogger.logUnix(name);
            saveData(name, log);
            break;
          case "LINUX":
            //TO-DO
            break;
        }
      }
    };

    (async () => {
      await promisify(setTimeout)(1000);
      while (true) {
        let time = Date.now();
        await memoryLog();

        time = Date.now() - time;
        if (time < 1000) await promisify(setTimeout)(1000 - time);
      }
    })();
  }

  public static memoryEvent(event: string) {
    this.processNames.forEach(name => {
      let original = fs.existsSync(`${name}.out`)
        ? fs.readFileSync(`${name}.out`, "utf-8")
        : "";
      fs.writeFileSync(`${name}.out`, `${original}< ${event} >`, "utf-8");
    });
  }

  private static async logWindows(name): Promise<MemoryLog> {
    let { stdout } = await this.exec(
          `powershell.exe -ExecutionPolicy ByPass -file ${path.resolve(
              __dirname,
              "../../scripts/get-process.ps1"
          )} -processName ${name}`
      );

      let getNext = () => {
          let index = stdout.toLowerCase().indexOf(name.toLowerCase());
          stdout = index !== -1 ? stdout.substring(index) : "";
          return stdout;
      };
      let totalPrivateWorkingSet = 0;
      let processTree: MemoryLog.Process[] = [];
      while (getNext()) {
          let name = stdout.substring(0, stdout.indexOf(" ")).trim();
          stdout = stdout.substring(stdout.indexOf(" ")).trim();

          let privateWorkingSet: number = Number.parseInt(stdout.substring(0,
              stdout.indexOf("\n") !== -1 ? stdout.indexOf("\n") : stdout.length));
          totalPrivateWorkingSet += privateWorkingSet;

          processTree.push(new MemoryLog.Process(name, privateWorkingSet));
      }

      return new MemoryLog(
          name,
          "Windows",
          this.LOG_STREAM_ID,
          totalPrivateWorkingSet,
          processTree
      );
  }

  private static async logUnix(name): Promise<MemoryLog> {
    let stdout: string = null;
    try {
      stdout = (await this.exec(
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
    let processTree: MemoryLog.Process[] = [];
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
      let privateWorkingSet: number = convert();
      stdout = stdout.substring(stdout.indexOf(" ")).trim();
      privateWorkingSet += convert();

      totalPrivateWorkingSet += privateWorkingSet;

      processTree.push(new MemoryLog.Process(name, privateWorkingSet));
    }

    return new MemoryLog(
      name,
      "Unix",
      this.LOG_STREAM_ID,
      totalPrivateWorkingSet,
      processTree
    );
  }
}
