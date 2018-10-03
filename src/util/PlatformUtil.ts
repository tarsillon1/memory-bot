import * as childProcess from "child_process";
import * as util from "util";
import * as path from "path";
import { promisify } from "util";

export default class PlatformUtil {
  private static readonly EXEC = util.promisify(childProcess.exec);

  /**
   * Focus process based on platform.
   * @param {string} processName the name of the process to focus.
   */
  public static async focusProcess(processName: string): Promise<void> {
    switch (this.getPlatform()) {
      case "WIN32":
        await this.execute(
          `powershell.exe -ExecutionPolicy ByPass -file ${path.resolve(
            __dirname,
            "../../scripts/focus.ps1"
          )} -processName ${processName}`
        );
        break;
      case "DARWIN":
        await this.execute(`open -a "${processName}"`);
        break;
      case "LINUX":
        break;
    }

    await promisify(setTimeout)(100);
  }

  /**
   * Execute process based on platform.
   * @param {string} executable the executable path.
   */
  public static async executeProcess(executable: string): Promise<void> {
    switch (this.getPlatform()) {
      case "WIN32":
        await this.execute(`powershell.exe Invoke-Item '${executable}'`);
        break;
      case "DARWIN":
        await this.execute(`open -a "${executable}"`);
        break;
      case "LINUX":
        break;
    }
  }

  /**
   * Full screen process based on platform.
   * @param {string} processName the name of the process to full screen.
   */
  public static async fullScreenProcess(processName: string) {
    switch (this.getPlatform()) {
      case "WIN32":
        await this.execute(
          `powershell.exe -ExecutionPolicy ByPass -file ${path.resolve(
            __dirname,
            "../../scripts/full-screen.ps1"
          )} -processName ${processName}`
        );
        break;
      case "DARWIN":
        await this.execute(
          `osascript ${path.resolve(
            __dirname,
            "../../scripts/full-screen.scpt"
          )} "${processName}"`
        );
        break;
      case "LINUX":
        break;
    }
  }

  /**
   * Set the window location and size based on process name.
   * @param {string} processName the process name
   * @param {number} x location of window x.
   * @param {number} y location of window y.
   * @param {number} width the width of the window.
   * @param {number} height the height of the window.
   */
  public static async setWindowProcess(
    processName: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    switch (this.getPlatform()) {
      case "WIN32":
        await this.execute(
          `powershell.exe ${path.resolve(
                      __dirname,
                      "../../scripts/set-window.ps1"
                    )} -ProcessName ${processName} -X ${x} -Y ${y} -Width ${width} -Height ${height} -Passthru`
        );
        break;
      case "DARWIN":
        await this.execute(
          `osascript ${path.resolve(
            __dirname,
            "../../scripts/set-window.scpt"
          )} "${processName}" ${x} ${y} ${width} ${height}`
        );
        break;
      case "LINUX":
        break;
    }
  }

  /**
   * Execute command.
   * @param {string} command the command.
   */
  public static async execute(command: string): Promise<{ stdout; stderr }> {
    return this.EXEC(command);
  }

  /**
   * Get the platform of the machine.
   * @returns {"WIN32" | "DARWIN" | "LINUX"}
   */
  public static getPlatform(): "WIN32" | "DARWIN" | "LINUX" {
    return process.platform.toUpperCase() as "WIN32" | "DARWIN" | "LINUX";
  }
}
