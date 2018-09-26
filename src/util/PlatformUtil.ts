import * as childProcess from "child_process";
import * as util from "util";
import * as path from "path";
import {promisify} from "util";

export default class PlatformUtil {
  private static readonly EXEC = util.promisify(childProcess.exec);

  public static async focusApplication(processName: string): Promise<void> {
    switch (this.getPlatform()) {
      case "WIN32":
        await this.execute(`powershell.exe -ExecutionPolicy ByPass -file ${path.resolve(
            __dirname,
            "../../scripts/focus.ps1"
        )} -processName ${processName}`);
        break;
      case "DARWIN":
        await this.execute(`open -a ${processName}`);
        break;
      case "LINUX":
        break;
    }

    await promisify(setTimeout)(100);
  }

  public static async executeApplication(executable: string): Promise<void> {
    switch (this.getPlatform()) {
      case "WIN32":
        await this.execute(`powershell.exe Invoke-Item '${executable}'`);
        break;
      case "DARWIN":
        await this.execute(`open -a ${executable}`);
        break;
      case "LINUX":
        break;
    }
  }

  public static async fullScreenApplication(processName: string) {
    switch (this.getPlatform()) {
      case "WIN32":
          await this.execute(`powershell.exe -ExecutionPolicy ByPass -file ${path.resolve(
              __dirname,
              "../../scripts/full-screen.ps1"
          )} -processName ${processName}`);
        break;
      case "DARWIN":
        await this.execute(
          `osascript ${path.resolve(
            __dirname,
            "../../scripts/full-screen.scpt"
          )} ${processName}`
        );
        break;
      case "LINUX":
        break;
    }
  }

  public static async execute(command: string): Promise<{ stdout; stderr }> {
    return this.EXEC(command);
  }

  public static getPlatform(): "WIN32" | "DARWIN" | "LINUX" {
    return process.platform.toUpperCase() as "WIN32" | "DARWIN" | "LINUX";
  }
}
