import * as dotenv from "dotenv";
import * as fs from "fs";
import ExecSteps from "./steps/ExecSteps";
import RobotSteps from "./steps/RobotSteps";
import BenchmarkRunner from "./util/BenchmarkRunner";
import * as path from "path";

dotenv.config();

(async () => {
  let benchmarkRunner = new BenchmarkRunner();
  let context: { benchmarks; steps } = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, `../benchmarks/${process.env.BENCHMARK}.json`),
      "UTF-8"
    )
  );

  await benchmarkRunner.registerSteps(new RobotSteps(), new ExecSteps());
  await benchmarkRunner.run(context);
})();
