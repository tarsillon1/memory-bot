import PlatformUtil from "./PlatformUtil";

export class BenchmarkContext {
  benchmarks: {
    unix: { processName: string; executable: string }[];
    windows: { processName: string; executable: string }[];
    linux: { processName: string; executable: string }[];
  };
  steps: ((processName: string) => void | Promise<void>)[];
}

export default class BenchmarkRunner {
  /**
   * Run the steps.
   */
  public async run(context: BenchmarkContext) {
    // Run executable depending on platform.
    let platform: string = PlatformUtil.getPlatform();
    switch (platform) {
      case "WIN32":
        platform = "windows";
        break;
      case "DARWIN":
        platform = "unix";
        break;
      case "LINUX":
        platform = "linux";
        break;
    }

    for (let benchmark of context.benchmarks[platform]) {
      await PlatformUtil.executeProcess(benchmark.executable);
    }

    for (let step of context.steps) {
      for (let benchmark of context.benchmarks[platform]) {
        await PlatformUtil.focusProcess(benchmark.processName);
        await Promise.resolve(step(benchmark.processName));
      }
    }
  }
}
