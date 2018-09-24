export class MetricLog {
  private readonly createdAt = new Date().toISOString();

  /**
   * @param {string} processName the process that this metric was based on.
   * @param {string} platform the platform this metric was computed on.
   * @param {string} logStreamId the unique ID of benchmarking instance.
   * @param {string} metricName the name of the metric.
   * @param {number} metricValue the value of the metric.
   * @param {MetricLog[]} logTree sub log metrics that this metric was based on.
   */
  constructor(
    readonly processName: string,
    readonly platform: string,
    readonly logStreamId: string,
    readonly metricName: string,
    readonly metricValue: number,
    readonly logTree: MetricLog[] = []
  ) {}
}
