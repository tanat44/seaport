export abstract class JobBase {
  private static count = 0;
  id: number;
  sequenceId: number | undefined;
  dependencies: number[];
  completed: boolean;

  constructor(dependencies: number[]) {
    this.id = JobBase.count++;
    this.dependencies = [...dependencies];
    this.completed = false;
  }
}
