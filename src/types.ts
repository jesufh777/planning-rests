export interface Resident {
  id: string;
  name: string;
  level: string; // R1, R2, R3, R4
  subLevel: string; // A, B
  specialty?: string;
  entryYear?: number;
  entryMonth?: number; // 0-11
  progress?: number; // 0-100
  durationMonths?: number; // Total duration in months
}

export interface Rotation {
  residentId: string;
  month: number; // 0-11
  type: RotationType;
}

export enum RotationType {
  RETINA = 'Retina',
  ESTRABISMO = 'Estrabismo',
  GLAUCOMA = 'Glaucoma',
  GUARDIA = 'Guardia',
  VACACIONES = 'Vacaciones',
  URGENCIAS = 'Urgencias',
  CORNEA = 'Córnea',
  EXTERNA = 'Externa',
  OCULOPLASTICA = 'Oculoplástica',
  PEDIATRIA = 'Pediatría',
  FINALIZADO = 'Finalizado',
  NO_INCORPORADO = 'No incorporado'
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
}

export interface ClinicalSection {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface RotationBlock {
  id: string;
  sectionId: string;
  duration: number; // in months
}

export type MasterPlan = {
  [pgy: number]: {
    blocksA: RotationBlock[];
    blocksB: RotationBlock[];
  }
};

export interface GlobalRule {
  id: string;
  text: string;
  active: boolean;
  type: 'exception' | 'constraint';
}

export interface RotationChangeRequest {
  id: string;
  residentId: string;
  currentSection: string;
  currentMonth: string;
  currentYear: string;
  newSection: string;
  newMonth: string;
  newYear: string;
  reason: string;
  status: 'pending' | 'processing' | 'confirmed';
  createdAt: any;
}

export interface ExecutionHistoryItem {
  id: string;
  proposedChange: string;
  autoImpact: string;
  result: 'success' | 'failed';
}
