export class MemoryLog {
  private readonly createdAt = new Date().toISOString();
  constructor(
    readonly processName: string,
    readonly platform: string,
    readonly logStreamId: string,
    readonly totalPrivateWorkingSet: number,
    readonly processTree: MemoryLog.Process[]
  ) {}
}

export namespace MemoryLog {
  export class Process {
    constructor(readonly name: string, readonly privateWorkingSet: number) {}
  }
}
