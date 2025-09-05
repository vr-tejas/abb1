export interface Dataset {
  datasetId: number;
  fileName: string;
  totalRows: number;
  totalColumns: number;
  passRate: number;
  earliestTimestamp?: Date;
  latestTimestamp?: Date;
}

export interface DateRangeRequest {
  datasetId: number;
  trainingStartDate: Date;
  trainingEndDate: Date;
  testingStartDate: Date;
  testingEndDate: Date;
  simulationStartDate: Date;
  simulationEndDate: Date;
}

export interface DateRangeResponse {
  isValid: boolean;
  errorMessage?: string;
  trainingRecordCount: number;
  testingRecordCount: number;
  simulationRecordCount: number;
}

export interface TrainingResponse {
  modelId: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
}

export interface SimulationRow {
  rowIndex: number;
  timestamp: Date;
  prediction?: number;
  confidence?: number;
  data: { [key: string]: any };
}

export interface SimulationResponse {
  row: SimulationRow;
  isCompleted: boolean;
}
