import "reflect-metadata";
import PlatformUtil from "./PlatformUtil";

export function Run(run: string) {
  return (target: any, property: string) => {
    if (!Reflect.getMetadata("runnable", target)) {
      Reflect.defineMetadata("runnable", new Map(), target);
    }
    Reflect.getMetadata("runnable", target).set(property, property);

    Reflect.defineMetadata("run", run, target, property);
  };
}

export function With(arg: string) {
  return (target: any, property: string, propertyIndex: number) => {
    Reflect.defineMetadata(`with:${propertyIndex}`, arg, target, property);
  };
}

class BenchmarkContext {
  benchmarks: {
    unix: { processName: string; executable: string }[];
    windows: { processName: string; executable: string }[];
  };
  steps: Step[];
}

class Step {
  given: string;
  run: string;
  with: object | string;
  then: Step;
}

export default class BenchmarkRunner {
  private runnable: Map<string, Function> = new Map();

  /**
   * Register an object containing steps logic.
   * @param {object} steps the object containing the steps.
   */
  public async registerSteps(...steps: Object[]) {
    for (let step of steps) {
      // Read each function within the object and search the property's metadata for the ID to call the function by.
      for (let property of Reflect.getMetadata("runnable", step).values()) {
        let run: string = Reflect.getMetadata("run", step, property);

        // On function call inject function parameters using args metadata.
        this.runnable.set(run, async (withArgs: any) => {
          let args = [];

          let index = 0;
          let param = null;
          while (index === 0 || param) {
            param = Reflect.getMetadata(`with:${index}`, step, property);

            let value = withArgs[param];
            if (typeof value === "string" && value.startsWith("$")) {
              value = process.env[value.substring(1)];
            }

            if (param) args.push(value);
            index++;
          }

          await step[property](...args);
        });
      }
    }
  }

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

    let givenMap = new Map<string, any>();
    for (let step of context.steps) {
      if (!step.given) {
        // Run the current step chain for all benchmark processes.
        for (let benchmark of context.benchmarks[platform]) {
          await PlatformUtil.focusProcess(benchmark.processName);

          let currentStep = step;
          while (currentStep) {
            // Inject env if input string value contains a dollar sign.
            if (typeof currentStep.with === "string") {
              currentStep.with = givenMap.get(currentStep.with);
            }
            currentStep.with = currentStep.with
              ? Object.assign(currentStep.with, {
                  processName: benchmark.processName
                })
              : { processName: benchmark.processName };

            await this.runnable.get(currentStep.run)(currentStep.with);
            currentStep = currentStep.then;
          }
        }
      } else {
        givenMap.set(step.given, step.with);
      }
    }
  }
}
