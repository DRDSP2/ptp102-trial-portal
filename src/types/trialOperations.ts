export type ShipmentStatus =
  | 'pending_dispatch'
  | 'dispatched'
  | 'in_transit'
  | 'held_at_customs'
  | 'delivered'
  | 'delivery_issue'
  | 'received_by_clinic';

export type StorageConfirmationStatus =
  | 'pending_confirmation'
  | 'confirmed_compliant'
  | 'potential_issue'
  | 'non_compliant';

export type ChecklistStatus = 'complete' | 'pending' | 'issue' | 'na';

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';

export type TrialReadinessOverallStatus =
  | 'not_ready'
  | 'awaiting_shipment'
  | 'awaiting_delivery'
  | 'awaiting_storage_confirmation'
  | 'protocol_clarification_required'
  | 'ready_for_enrolment'
  | 'active';

export type Shipment = {
  trackingNumber: string;
  carrier: string;
  shipmentStatus: ShipmentStatus;
  dispatchDate: string | null;
  expectedDeliveryDate: string | null;
  deliveredDate: string | null;
  receivedByClinic: boolean;
  receivedByClinicDate: string | null;
  receivedByClinicName: string | null;
  bottlesReceivedAtClinic: number | null;
  shipmentNotes: string;
};

export type DrugSupply = {
  productName: string;
  batchNumber: string;
  lotNumber: string;
  bottlesSupplied: number | null;
  bottleSize: string;
  bottleVolumeMl: number | null;
  bottlesReceived: number | null;
  bottlesRemaining: number | null;
  customsInvoiceQuantity: number | null;
  clinicConfirmedQuantity: number | null;
  inventoryDiscrepancy: boolean;
  inventoryNotes: string;
  dateReceived: string | null;
  receivedByWhom: string | null;
};

export type StorageConditions = {
  requiredStorageTemperature: string;
  actualStorageTemperature: string | null;
  storageLocation: string | null;
  refrigerated: boolean | null;
  lightProtected: boolean | null;
  originalShippingBoxRetained: boolean | null;
  foilWrappingRetained: boolean | null;
  storageConfirmed: boolean;
  storageConfirmationStatus: StorageConfirmationStatus;
  storageConfirmedBy: string | null;
  storageConfirmedDate: string | null;
  storageNotes: string;
};

export type ProtocolLabelInfo = {
  protocolVersion: string;
  protocolApproved: boolean;
  protocolApprovedBy: string | null;
  protocolApprovedDate: string | null;
  approvedDose: string;
  infusionTime: string | null;
  handlingInstructions: string;
  labelText: string | null;
  bottleLabelReviewed: boolean;
  storageInstructionsOnLabel: boolean | null;
  supplyFormatConfirmed: boolean | null;
  bottleSizeConfirmed: boolean | null;
  infusionTimeConfirmed: boolean | null;
  administrationProcedureStatus: ChecklistStatus;
  protocolCompletenessNotes: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
  status: ChecklistStatus;
  notes: string;
  lastUpdated: string | null;
  updatedBy: string | null;
};

export type AdminTask = {
  id: string;
  taskTitle: string;
  taskDescription: string;
  assignedTo: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  notes: string;
  completedDate: string | null;
  createdAt: string;
};

export type TrialOperations = {
  shipment: Shipment;
  drugSupply: DrugSupply;
  storage: StorageConditions;
  protocol: ProtocolLabelInfo;
  checklist: ChecklistItem[];
  adminTasks: AdminTask[];
  siteReadinessOverride: TrialReadinessOverallStatus | null;
  siteReadinessOverrideBy: string | null;
  siteReadinessOverrideDate: string | null;
  siteReadinessOverrideReason: string | null;
};

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: 'supply_format',
    label: 'Drug supply format confirmed',
    status: 'pending',
    notes: '',
    lastUpdated: null,
    updatedBy: null,
  },
  {
    id: 'bottle_size',
    label: 'Bottle size confirmed',
    status: 'pending',
    notes: '',
    lastUpdated: null,
    updatedBy: null,
  },
  {
    id: 'bottle_count',
    label: 'Bottle count confirmed',
    status: 'pending',
    notes: '',
    lastUpdated: null,
    updatedBy: null,
  },
  {
    id: 'storage_temp',
    label: 'Storage temperature confirmed',
    status: 'pending',
    notes: '',
    lastUpdated: null,
    updatedBy: null,
  },
  {
    id: 'label_storage',
    label: 'Bottle label storage instructions confirmed',
    status: 'pending',
    notes: '',
    lastUpdated: null,
    updatedBy: null,
  },
  {
    id: 'infusion_time',
    label: 'Infusion time confirmed',
    status: 'pending',
    notes: '',
    lastUpdated: null,
    updatedBy: null,
  },
  {
    id: 'inventory_count',
    label: 'Clinic inventory count confirmed',
    status: 'pending',
    notes: '',
    lastUpdated: null,
    updatedBy: null,
  },
  {
    id: 'protocol_version',
    label: 'Protocol version approved',
    status: 'pending',
    notes: '',
    lastUpdated: null,
    updatedBy: null,
  },
];

export const DEFAULT_TRIAL_OPERATIONS: TrialOperations = {
  shipment: {
    trackingNumber: '',
    carrier: '',
    shipmentStatus: 'pending_dispatch',
    dispatchDate: null,
    expectedDeliveryDate: null,
    deliveredDate: null,
    receivedByClinic: false,
    receivedByClinicDate: null,
    receivedByClinicName: null,
    bottlesReceivedAtClinic: null,
    shipmentNotes: '',
  },
  drugSupply: {
    productName: 'PTP-102 / methylated tirilazad',
    batchNumber: '',
    lotNumber: '',
    bottlesSupplied: null,
    bottleSize: '1L',
    bottleVolumeMl: 1000,
    bottlesReceived: null,
    bottlesRemaining: null,
    customsInvoiceQuantity: null,
    clinicConfirmedQuantity: null,
    inventoryDiscrepancy: false,
    inventoryNotes: '',
    dateReceived: null,
    receivedByWhom: null,
  },
  storage: {
    requiredStorageTemperature: '2-8°C',
    actualStorageTemperature: null,
    storageLocation: null,
    refrigerated: null,
    lightProtected: null,
    originalShippingBoxRetained: null,
    foilWrappingRetained: null,
    storageConfirmed: false,
    storageConfirmationStatus: 'pending_confirmation',
    storageConfirmedBy: null,
    storageConfirmedDate: null,
    storageNotes: '',
  },
  protocol: {
    protocolVersion: '1.0',
    protocolApproved: false,
    protocolApprovedBy: null,
    protocolApprovedDate: null,
    approvedDose: '500 mL IV (5 mg/mL)',
    infusionTime: '15-30 minutes',
    handlingInstructions:
      'Store at 2-8°C. Protect from light. Do not freeze. Inspect for particulate matter before use.',
    labelText: null,
    bottleLabelReviewed: false,
    storageInstructionsOnLabel: null,
    supplyFormatConfirmed: null,
    bottleSizeConfirmed: null,
    infusionTimeConfirmed: null,
    administrationProcedureStatus: 'pending',
    protocolCompletenessNotes: '',
  },
  checklist: DEFAULT_CHECKLIST,
  adminTasks: [],
  siteReadinessOverride: null,
  siteReadinessOverrideBy: null,
  siteReadinessOverrideDate: null,
  siteReadinessOverrideReason: null,
};
