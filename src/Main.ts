import * as dotenv from "dotenv";
import BenchmarkRunner from "./util/BenchmarkRunner";
import * as path from "path";
dotenv.config();

(async () => {
  let benchmarkRunner = new BenchmarkRunner();
  await benchmarkRunner.run(
    require(path.resolve(
      __dirname,
      `../build/benchmarks/${process.env.BENCHMARK}`
    )).default
  );
})();
