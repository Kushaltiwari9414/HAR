
export interface SensorData {
  x: number;
  y: number;
  z: number;
  alpha: number; // Rotation around Z axis (deg/s)
  beta: number;  // Rotation around X axis (deg/s)
  gamma: number; // Rotation around Y axis (deg/s)
  timestamp: number;
}

export interface ProcessedFeatures {
  acc_x_mean: number;
  acc_x_std: number;
  acc_y_mean: number;
  acc_y_std: number;
  acc_z_mean: number;
  acc_z_std: number;
  
  gyro_alpha_mean: number;
  gyro_alpha_std: number;
  gyro_beta_mean: number;
  gyro_beta_std: number;
  gyro_gamma_mean: number;
  gyro_gamma_std: number;
}

export interface ActivityPrediction {
  activity: string;
  confidence: number;
  emoji: string;
  reasoning: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  ERROR = 'ERROR'
}
