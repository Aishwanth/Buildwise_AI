import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIPlanningResult, BlueprintRoom, TimelineOptimizationResult } from "../types";

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn("WARNING: VITE_GEMINI_API_KEY is not set. AI features may fail.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const analyzeConstructionScenario = async (prompt: string): Promise<AIPlanningResult> => {
  const systemPrompt = `You are an expert construction planning AI specialized in the Indian market.
  Analyze the user's request and provide a detailed construction plan in strict JSON format.
  
  COST BENCHMARKS (CRITICAL):
  - Residential Construction: ₹14,400 to ₹17,100 per Square Yard (equivalent to ₹1600-1900 per Sq.Ft).
  - Commercial Construction: ₹19,800 to ₹25,200 per Square Yard (equivalent to ₹2200-2800 per Sq.Ft).
  
  Always use these benchmarks to calculate the total cost based on the totalAreaSqYards.
  
  TIMELINE EXPECTATIONS:
  - Small Residential (up to 200 sq yards): 6-8 months.
  - Large Residential / Small Commercial: 10-14 months.
  - Large Commercial: 18-24 months.
  
  The JSON output must strictly adhere to this structure:
  {
    "workerRequirements": [
      { "role": "string (e.g., Mason)", "count": number }
    ],
    "totalLaborDays": number,
    "timeline": {
      "days": number,
      "weeks": number,
      "months": number
    },
    "costBreakdown": [
      { "category": "string (e.g., Labor, Materials)", "amount": number, "description": "string" }
    ],
    "materialRequirements": [
      { "item": "string", "quantity": "string", "unit": "string" }
    ],
    "blueprint": {
      "rooms": [
        { "name": "string", "x": number, "y": number, "width": number, "height": number }
      ],
      "totalAreaSqYards": number
    },
    "schedule": [
      { 
        "week": number, 
        "phase": "string", 
        "activities": ["string"], 
        "resources": ["string"] 
      }
    ]
  }
  
  Ensure all numerical values are realistic for the given project scale and use the cost benchmarks provided above.
  Do not include any markdown formatting (like \`\`\`json) in the response, just the raw JSON string.`;

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("VITE_GEMINI_API_KEY is missing from environment variables. Please check .env.local");
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nUser Request: ${prompt}` }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const response = await result.response;
    const jsonStr = response.text();

    if (!jsonStr) throw new Error("Empty response from Gemini API");

    const sanitized = sanitizeJson(jsonStr);
    try {
      return JSON.parse(sanitized);
    } catch (parseError) {
      console.error("JSON Parse Error. Original String:", jsonStr);
      throw new Error("AI returned invalid JSON format. Please try again.");
    }
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    alert(`Analysis Failed: ${error.message || "Unknown error"}`);
    throw error;
  }
};
export const analyzeBlueprintImage = async (base64Image: string): Promise<{ rooms: BlueprintRoom[]; totalAreaSqYards: number }> => {
  const prompt = "Analyze this architectural blueprint image and extract the rooms with their coordinates (x, y) and dimensions (width, height). Use a coordinate system where 1 unit = 1 meter. Ensure coordinates start near (0,0) and represent the floor plan accurately. Include room names like 'Living Room', 'Kitchen', etc.";
  const systemPrompt = `You are a professional architectural AI. Your task is to extract a structured 2D floor plan from a blueprint image.
  
  CRITICAL RULES:
  1. Return ONLY a valid JSON object.
  2. Rooms must have: name, x, y, width, height (all numbers).
  3. totalAreaSqYards must be a number.
  4. Ensure rooms don't overlap excessively and are placed logically.
  5. The coordinate system should be consistent.
  
  Output Structure:
  {
    "rooms": [
      { "name": "Name", "x": 0.0, "y": 0.0, "width": 5.0, "height": 4.0 }
    ],
    "totalAreaSqYards": 120
  }`;

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("VITE_GEMINI_API_KEY is missing. Please check your .env.local file.");
    }

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: `${systemPrompt}\n\nTask: ${prompt}` },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(',')[1] || base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const response = await result.response;
    const jsonStr = response.text();

    if (!jsonStr) throw new Error("Empty response from AI");

    const sanitized = sanitizeJson(jsonStr);
    try {
      return JSON.parse(sanitized);
    } catch (parseError) {
      console.error("JSON Parse Error. Original String:", jsonStr);
      throw new Error("AI returned invalid JSON format. Please try again.");
    }
  } catch (error: any) {
    console.error("Blueprint Image Analysis Error:", error);
    throw error;
  }
};

/**
 * Helper to clean up JSON string from AI response
 * Removes markdown code blocks if present
 */
const sanitizeJson = (str: string): string => {
  let cleaned = str.trim();
  // Remove markdown code blocks if present (```json or ```)
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "");
    cleaned = cleaned.replace(/\n?```$/, "");
  }
  // Sometimes AI adds text before or after the JSON. 
  // Let's try to find the first '{' and last '}'
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  return cleaned;
};

export const calculateTimelineOptimization = async (params: {
  area: number;
  projectType: string;
  floors: string;
  targetDays: number
}): Promise<TimelineOptimizationResult> => {
  const prompt = `Calculate detailed construction optimization metrics for a ${params.projectType} project:
  - Total Area: ${params.area} Sq. Yards
  - Floors: ${params.floors}
  - Target Completion: ${params.targetDays} Days
  
  Based on these parameters, simulate and provide numerical outputs for:
  1. Scheduling & Planning (Tasks, Milestones, Dependencies)
  2. CPM (Critical Activities, Final Duration, Risk Factor 0-1)
  3. Resource Optimization (Utilization %, Efficiency %, Waste Reduction %)
  4. Parallel Execution (Overlap %, Days Saved, Coordination Score 1-10)
  5. Progress Monitoring (Updates/Week, Projected Variance %, Status)
  6. Risk Management (Risk Count, Buffer Days, Contingency ₹)
  7. Tech Integration (Boost %, Accuracy %, Uptime %)
  8. Communication (Approval Boost %, Meeting Reduction, Clarity 1-10)
  9. Lean Construction (Value-Add %, Rework Reduction %, Reliability Index 0-1)
  10. Performance (SPI 0-2, Variance %, Improvement Potential %)`;

  const systemPrompt = `You are a high-precision construction analytics engine. 
  Calculate and return ONLY a JSON object matching this structure:
  {
    "scheduling": { "ganttTasks": number, "totalMilestones": number, "avgDependencyCount": number },
    "cpm": { "criticalActivities": number, "durationDays": number, "riskFactor": number },
    "resourceOptimization": { "laborUtilization": number, "machineryEfficiency": number, "materialWastageReduction": number },
    "parallelExecution": { "overlapPercentage": number, "timeSavedDays": number, "coordinationIntensity": number },
    "progressMonitoring": { "updateFrequencyPerWeek": number, "projectedVariance": number, "earlyWarningStatus": "string" },
    "riskManagement": { "riskCount": number, "bufferDays": number, "contingencyAmount": number },
    "techIntegration": { "efficiencyBoost": number, "dataAccuracy": number, "mobileUptime": number },
    "communication": { "approvalSpeedBoost": number, "meetingCountReduced": number, "clarityScore": number },
    "leanPractices": { "valueAddActivitiesPercent": number, "reworkReducedPercent": number, "reliabilityIndex": number },
    "performanceAnalysis": { "spi": number, "plannedVsActualVariance": number, "improvementPotential": number }
  }`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nProject Data: ${JSON.stringify(params)}\n\nCommand: ${prompt}` }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const response = await result.response;
    const jsonStr = response.text();

    if (!jsonStr) throw new Error("Empty response from AI");

    const sanitized = sanitizeJson(jsonStr);
    try {
      return JSON.parse(sanitized);
    } catch (parseError) {
      console.error("JSON Parse Error. Original String:", jsonStr);
      throw new Error("AI returned invalid JSON format. Please try again.");
    }
  } catch (error: any) {
    console.error("Timeline Optimization Error:", error);
    throw error;
  }
};
