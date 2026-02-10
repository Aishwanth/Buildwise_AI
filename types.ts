
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCENARIO_1 = 'SCENARIO_1',
  SCENARIO_2 = 'SCENARIO_2',
  SCENARIO_3 = 'SCENARIO_3',
  SCENARIO_4 = 'SCENARIO_4',
  WORKERS = 'WORKERS',
  MATERIALS = 'MATERIALS',
  DAILY_WORK_UPDATE = 'DAILY_WORK_UPDATE',
  BLUEPRINT_3D = 'BLUEPRINT_3D',
  TASK_ASSIGNMENT = 'TASK_ASSIGNMENT',
  BUDGET_TRACKING = 'BUDGET_TRACKING',
  OWNER_PORTAL = 'OWNER_PORTAL'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Worker ID or Name
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  deadline: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: string;
}

export interface BudgetSummary {
  planned: number;
  actual: number;
  categories: {
    name: string;
    planned: number;
    actual: number;
  }[];
}

export interface Worker {
  id: string;
  name: string;
  role: 'Mason' | 'Helper' | 'Steel Worker' | 'Carpenter' | 'Supervisor';
  dailyWage: number;
  attendance: boolean[]; // 30 days
  safetyChecks?: {
    helmetWorn: boolean;
    glovesWorn: boolean;
    shoesWorn: boolean;
    timestamp: string;
  };
}

export interface BlueprintRoom {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  corners?: [number, number][];
  area?: number;
}

export interface BlueprintWall {
  start_point: [number, number];
  end_point: [number, number];
  thickness: number;
  height: number;
}

export interface BlueprintDoor {
  position: [number, number];
  width: number;
}

export interface BlueprintWindow {
  position: [number, number];
  width: number;
  height: number;
}

export interface BIMModel {
  walls: BlueprintWall[];
  rooms: BlueprintRoom[];
  doors: BlueprintDoor[];
  windows: BlueprintWindow[];
  floors: number;
  floor_height: number;
  metadata?: {
    total_wall_length: number;
    total_floor_area: number;
    room_metrics?: any;
    material_quantities?: any;
    scale_factor?: number;
  };
}

export interface AIPlanningResult {
  workerRequirements: { role: string; count: number }[];
  totalLaborDays: number;
  timeline: { days: number; weeks: number; months: number };
  costBreakdown: { category: string; amount: number; description: string }[];
  materialRequirements: { item: string; quantity: string; unit: string }[];
  blueprint?: {
    rooms: BlueprintRoom[];
    walls?: BlueprintWall[];
    doors?: BlueprintDoor[];
    windows?: BlueprintWindow[];
    totalAreaSqYards: number;
    bimModel?: BIMModel;
  };
  schedule?: {
    week: number;
    phase: string;
    activities: string[];
    resources: string[];
  }[];
}

export interface TimelineOptimizationResult {
  scheduling: { ganttTasks: number; totalMilestones: number; avgDependencyCount: number };
  cpm: { criticalActivities: number; durationDays: number; riskFactor: number };
  resourceOptimization: { laborUtilization: number; machineryEfficiency: number; materialWastageReduction: number };
  parallelExecution: { overlapPercentage: number; timeSavedDays: number; coordinationIntensity: number };
  progressMonitoring: { updateFrequencyPerWeek: number; projectedVariance: number; earlyWarningStatus: string };
  riskManagement: { riskCount: number; bufferDays: number; contingencyAmount: number };
  techIntegration: { efficiencyBoost: number; dataAccuracy: number; mobileUptime: number };
  communication: { approvalSpeedBoost: number; meetingCountReduced: number; clarityScore: number };
  leanPractices: { valueAddActivitiesPercent: number; reworkReducedPercent: number; reliabilityIndex: number };
  performanceAnalysis: { spi: number; plannedVsActualVariance: number; improvementPotential: number };
}

export interface Risk {
  id: string;
  name: string;
  type: 'Weather' | 'Labor' | 'Supply' | 'Financial';
  impactDays: number;
  impactCost: number;
  probability: number; // 0 to 1
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  costModifier: number; // multiplier, e.g. 0.9 for 10% reduction
  timeModifier: number; // multiplier
  riskModifier: number; // multiplier
}

export interface ProjectState {
  area: number;
  projectType: string;
  floors: string;
  risks: Risk[];
  activeScenarios: string[]; // Scenario IDs
}
