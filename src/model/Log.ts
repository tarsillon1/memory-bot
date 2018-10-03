export class Log {
  /**
   * @param fields the log metadata.
   * @param {Log[]} relatedLogs array of related logs.
   * @param createdAt when this log was created.
   */
  constructor(
    readonly fields: any = {},
    readonly relatedLogs: Log[] = [],
    readonly createdAt = new Date().toISOString()
  ) {}
}
