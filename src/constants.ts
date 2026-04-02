import { Resident, Rotation, RotationType, Alert, ClinicalSection, MasterPlan } from './types';

export const RESIDENTS: Resident[] = [
  { id: '1', name: 'Dr. Garcia', level: 'R4', subLevel: 'A', durationMonths: 48, entryYear: 2022, entryMonth: 4 },
  { id: '2', name: 'Dr. Lopez', level: 'R4', subLevel: 'B', durationMonths: 48, entryYear: 2022, entryMonth: 4 },
  { id: '3', name: 'Dr. Martinez', level: 'R3', subLevel: 'A', durationMonths: 48, entryYear: 2023, entryMonth: 4 },
  { id: '4', name: 'Dr. Sanchez', level: 'R3', subLevel: 'B', durationMonths: 48, entryYear: 2023, entryMonth: 4 },
  { id: '5', name: 'Dr. Perez', level: 'R2', subLevel: 'A', durationMonths: 48, entryYear: 2024, entryMonth: 4 },
  { id: '6', name: 'Dr. Torres', level: 'R2', subLevel: 'B', durationMonths: 48, entryYear: 2024, entryMonth: 4 },
  { id: '7', name: 'Dr. Ruiz', level: 'R1', subLevel: 'A', durationMonths: 48, entryYear: 2025, entryMonth: 4 },
  { id: '8', name: 'Dr. Diaz', level: 'R1', subLevel: 'B', durationMonths: 48, entryYear: 2025, entryMonth: 4 },
];

export const MOCK_SECTIONS: ClinicalSection[] = [
  { id: '1', name: 'Urgencias', color: 'bg-error', icon: 'emergency' },
  { id: '2', name: 'Córnea', color: 'bg-secondary', icon: 'visibility' },
  { id: '3', name: 'Retina', color: 'bg-primary-container', icon: 'hub' },
  { id: '4', name: 'Glaucoma', color: 'bg-tertiary', icon: 'opacity' },
  { id: '5', name: 'Oculoplástica', color: 'bg-slate-500', icon: 'face' },
  { id: '6', name: 'Pediatría', color: 'bg-orange-500', icon: 'child_care' },
  { id: '7', name: 'Estrabismo', color: 'bg-pink-500', icon: 'group' },
  { id: '8', name: 'Externa', color: 'bg-indigo-500', icon: 'public' },
  { id: '9', name: 'Vacaciones', color: 'bg-surface-container-highest', icon: 'beach_access' },
  { id: '10', name: 'Guardia', color: 'bg-tertiary-fixed', icon: 'activity' },
];

export const INITIAL_MASTER_PLAN: MasterPlan = {
  1: {
    blocksA: [
      { id: 'r1a-1', sectionId: '1', duration: 3 }, // Urgencias
      { id: 'r1a-2', sectionId: '2', duration: 3 }, // Córnea
      { id: 'r1a-3', sectionId: '3', duration: 3 }, // Retina
      { id: 'r1a-4', sectionId: '9', duration: 3 }, // Vacaciones
    ],
    blocksB: [
      { id: 'r1b-1', sectionId: '2', duration: 3 }, // Córnea
      { id: 'r1b-2', sectionId: '3', duration: 3 }, // Retina
      { id: 'r1b-3', sectionId: '1', duration: 3 }, // Urgencias
      { id: 'r1b-4', sectionId: '9', duration: 3 }, // Vacaciones
    ]
  },
  2: {
    blocksA: [
      { id: 'r2a-1', sectionId: '4', duration: 3 }, // Glaucoma
      { id: 'r2a-2', sectionId: '5', duration: 3 }, // Oculoplástica
      { id: 'r2a-3', sectionId: '6', duration: 3 }, // Pediatría
      { id: 'r2a-4', sectionId: '9', duration: 3 }, // Vacaciones
    ],
    blocksB: [
      { id: 'r2b-1', sectionId: '5', duration: 3 }, // Oculoplástica
      { id: 'r2b-2', sectionId: '6', duration: 3 }, // Pediatría
      { id: 'r2b-3', sectionId: '4', duration: 3 }, // Glaucoma
      { id: 'r2b-4', sectionId: '9', duration: 3 }, // Vacaciones
    ]
  },
  3: {
    blocksA: [
      { id: 'r3a-1', sectionId: '3', duration: 3 }, // Retina
      { id: 'r3a-2', sectionId: '7', duration: 3 }, // Estrabismo
      { id: 'r3a-3', sectionId: '8', duration: 3 }, // Ext.
      { id: 'r3a-4', sectionId: '9', duration: 3 }, // Vacaciones
    ],
    blocksB: [
      { id: 'r3b-1', sectionId: '7', duration: 3 }, // Estrabismo
      { id: 'r3b-2', sectionId: '8', duration: 3 }, // Ext.
      { id: 'r3b-3', sectionId: '3', duration: 3 }, // Retina
      { id: 'r3b-4', sectionId: '9', duration: 3 }, // Vacaciones
    ]
  },
  4: {
    blocksA: [
      { id: 'r4a-1', sectionId: '4', duration: 3 }, // Glaucoma
      { id: 'r4a-2', sectionId: '5', duration: 3 }, // Oculoplástica
      { id: 'r4a-3', sectionId: '3', duration: 3 }, // Retina
      { id: 'r4a-4', sectionId: '9', duration: 3 }, // Vacaciones
    ],
    blocksB: [
      { id: 'r4b-1', sectionId: '5', duration: 3 }, // Oculoplástica
      { id: 'r4b-2', sectionId: '3', duration: 3 }, // Retina
      { id: 'r4b-3', sectionId: '4', duration: 3 }, // Glaucoma
      { id: 'r4b-4', sectionId: '9', duration: 3 }, // Vacaciones
    ]
  }
};

export const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'error',
    title: 'Brecha Crítica de Cobertura',
    description: 'Retina Quirúrgica sin R3/R4 en Mayo'
  },
  {
    id: '2',
    type: 'warning',
    title: 'Incumplimiento: Guardias Secuenciales',
    description: 'Dr. Garcia (R4A) tiene guardias programadas inmediatamente tras vacaciones en Junio.'
  },
  {
    id: '3',
    type: 'error',
    title: 'Mínimo de Personal no Alcanzado',
    description: 'Capacidad excedida en Urgencias (Julio).'
  }
];

export const MOCK_LAST_CHANGES = [
  { id: '1', resident: 'Dr. Garcia', change: 'Retina → Glaucoma', date: 'Hace 2 horas', status: 'confirmed' },
  { id: '2', resident: 'Dr. Lopez', change: 'Vacaciones → Urgencias', date: 'Hace 5 horas', status: 'confirmed' },
  { id: '3', resident: 'Dr. Ruiz', change: 'Córnea → Retina', date: 'Ayer', status: 'confirmed' },
];
