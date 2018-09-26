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
      for (let property of Reflect.getMetadata("runnable", step).values()) {
        let run: string = Reflect.getMetadata("run", step, property);
        this.runnable.set(run, async (withArgs: any) => {
          let args = [];

          let index = 0;
          let param = null;
          while (index === 0 || param) {
            param = Reflect.getMetadata(`with:${index}`, step, property);
            if (param) args.push(withArgs[param]);
            index++;
          }

          await step[property](...args);
        });
      }
    }
  }

  /**
   * Run the steps.
   * @param context {{steps: object[]}} the step context.
   */
  public async run(context: { benchmarks: { processName : string, executable : string }[]; steps: Step[] }) {
    for (let benchmark of context.benchmarks) {
      await PlatformUtil.executeApplication(benchmark.executable);
    }

      let givenMap = new Map<string, any>();
      for (let step of context.steps) {
          if (!step.given) {
              for (let benchmark of context.benchmarks) {
                  await PlatformUtil.focusApplication(benchmark.processName);

                  let currentStep = step;
                  while (currentStep) {
                      if (typeof currentStep.with === "string") {
                          currentStep.with = givenMap.get(currentStep.with);
                      }
                      currentStep.with = currentStep.with ? Object.assign(currentStep.with, { processName: benchmark.processName }) : { processName: benchmark.processName };

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
