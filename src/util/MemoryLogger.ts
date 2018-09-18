import * as path from "path";
import * as util from "util";
import * as childProcess from "child_process";

export default class MemoryLogger {
    private static readonly exec = util.promisify(childProcess.exec);

    static async logWindows(name): Promise<string> {
        const {stdout} = await this.exec(`powershell.exe -ExecutionPolicy ByPass -file ${path.resolve(__dirname,
            "../../scripts/get-process.ps1")} -processName ${name}`);

        return stdout;
    };
}