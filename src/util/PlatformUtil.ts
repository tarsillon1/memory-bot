import * as childProcess from "child_process";
import * as util from "util";
import * as path from "path";

export default class PlatformUtil {
  private static readonly EXEC = util.promisify(childProcess.exec);

  public static async focusApplication(application: string): Promise<void> {
    switch (this.getPlatform()) {
      case "WIN32":
        await this.execute(`powershell.exe -ExecutionPolicy ByPass -file ${path.resolve(
            __dirname,
            "../../scripts/focus.ps1"
        )} -processName ${this.windowsApplicationName(application)}`);
        break;
      case "DARWIN":
        await this.execute(`open -a ${application}`);
        break;
      case "LINUX":
        break;
    }
  }

  public static async executeApplication(application: string): Promise<void> {
    switch (this.getPlatform()) {
      case "WIN32":
        await this.execute(`powershell.exe Start-Process -FilePath "${application}"`);
        break;
      case "DARWIN":
        await this.execute(`open -a ${application}`);
        break;
      case "LINUX":
        break;
    }
  }

  public static async fullScreenApplication(application: string) {
    switch (this.getPlatform()) {
      case "WIN32":
          await this.execute(`powershell.exe -ExecutionPolicy ByPass -file ${path.resolve(
              __dirname,
              "../../scripts/full-screen.ps1"
          )} -processName ${this.windowsApplicationName(application)}`);
        break;
      case "DARWIN":
        await this.execute(
          `osascript ${path.resolve(
            __dirname,
            "../../scripts/full-screen.scpt"
          )} ${application}`
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

  public static windowsApplicationName(application : string) {
    return application.substring(application.lastIndexOf("\\")  + 1, application.indexOf("."));
  }
}
