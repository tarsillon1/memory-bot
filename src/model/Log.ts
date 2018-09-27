export class Log {
    /**
     * @param {string} logStreamId the unique ID of this log stream.
     * @param metadata the log metadata.
     * @param {Log[]} logTree array of related logs.
     * @param createdAt when this log was created.
     */
  constructor(
    readonly logStreamId: string,
    readonly metadata: object = {},
    readonly logTree: Log[] = [],
    readonly createdAt = new Date().toISOString()
  ) {}
}
