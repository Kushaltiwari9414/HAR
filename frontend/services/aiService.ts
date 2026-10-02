import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProcessedFeatures, ActivityPrediction } from "../types";

const SYSTEM_INSTRUCTION = `
You are an advanced Human Activity Recognition (HAR) engine.
Your task is to analyze aggregated accelerometer and gyroscope feature data from a smartphone and predict the user's current physical activity.

The input will be statistical features calculated from a 5-second sliding window of sensor data:
- acc_{axis}_mean: Average acceleration in m/s².
- acc_{axis}_std: Standard deviation of acceleration (indicates intensity/variance).
- gyro_{axis}_mean: Average rotation rate in deg/s.
- gyro_{axis}_std: Standard deviation of rotation rate.

DATA INTERPRETATION:
- Accelerometer: Measures linear forces (Gravity + Motion).
- Gyroscope: Measures rate of rotation.
  - High Gyro Std Dev = Rapid turning/twisting (e.g., Sports, checking phone frantically).
  - Low Gyro Std Dev + High Accel Y = Running straight.
  - Low Accel + Low Gyro = Stationary (Sitting/Standing).

CRITICAL INSTRUCTION FOR STABILITY:
Human activities have high temporal consistency. People do not switch instantly between "Sitting" and "Running" every second.
- If the 'Previous Activity' is provided and the new sensor data is ambiguous or similar to the previous state, bias your prediction to maintain the 'Previous Activity'.
- Only switch the activity if the sensor data pattern strongly and clearly indicates a change (e.g., a massive spike in variance indicating a transition from Standing to Running).

Return a JSON object with the activity name, a confidence score (0-100), a relevant emoji, and a brief one-sentence reasoning.
`;

export const classifyActivity = async (features: ProcessedFeatures, previousActivity?: string): Promise<ActivityPrediction> => {
  if (!process.env.AI_API_KEY && !process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const apiKey = process.env.AI_API_KEY || process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Context:
    Previous Activity: ${previousActivity || "None / Initializing"}
    
    Current Sensor Features (Last 5 Seconds):
    -- Accelerometer (m/s²) --
    X: Mean ${features.acc_x_mean.toFixed(2)}, Std ${features.acc_x_std.toFixed(2)}
    Y: Mean ${features.acc_y_mean.toFixed(2)}, Std ${features.acc_y_std.toFixed(2)}
    Z: Mean ${features.acc_z_mean.toFixed(2)}, Std ${features.acc_z_std.toFixed(2)}
    
    -- Gyroscope (deg/s) --
    Alpha (Z-axis/Yaw):   Mean ${features.gyro_alpha_mean.toFixed(2)}, Std ${features.gyro_alpha_std.toFixed(2)}
    Beta (X-axis/Pitch):  Mean ${features.gyro_beta_mean.toFixed(2)}, Std ${features.gyro_beta_std.toFixed(2)}
    Gamma (Y-axis/Roll):  Mean ${features.gyro_gamma_mean.toFixed(2)}, Std ${features.gyro_gamma_std.toFixed(2)}
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      activity: { type: Type.STRING, description: "The predicted activity (e.g., Walking, Running, Sitting, Standing, Jumping, Phone Usage)" },
      confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 100" },
      emoji: { type: Type.STRING, description: "A single emoji representing the activity" },
      reasoning: { type: Type.STRING, description: "Brief explanation of why this activity was chosen, referencing the specific sensor patterns." },
    },
    required: ["activity", "confidence", "emoji", "reasoning"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI service");

    const result = JSON.parse(jsonText) as Omit<ActivityPrediction, 'timestamp'>;
    
    return {
      ...result,
      timestamp: Date.now(),
    };

  } catch (error) {
    console.error("AI service error:", error);
    return {
      activity: "Unknown",
      confidence: 0,
      emoji: "❓",
      reasoning: "Could not connect to AI service.",
      timestamp: Date.now()
    };
  }
};
