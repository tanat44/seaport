export enum TruckStatus {
  Idle = "Idle",
  Move = "Move",
  QueueTraffic = "QueueTraffic",
}

export enum TrafficType {
  Opposing = "Opposing",
  Queuing = "Queuing", // two trucks going in the same direction
}

export type SafetyFieldDetection = {
  anotherTruckId: string;
  trafficType: TrafficType;
};
