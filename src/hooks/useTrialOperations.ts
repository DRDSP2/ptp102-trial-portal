import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  type TrialOperations,
  type Shipment,
  type DrugSupply,
  type StorageConditions,
  type ProtocolLabelInfo,
  type ChecklistItem,
  type AdminTask,
  type TrialReadinessOverallStatus,
  DEFAULT_TRIAL_OPERATIONS,
} from '@/types/trialOperations';

const STORAGE_KEY = 'ptp102_trial_operations_v1';

function loadOps(): TrialOperations {
  if (typeof window === 'undefined') return DEFAULT_TRIAL_OPERATIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TRIAL_OPERATIONS;
    const parsed = JSON.parse(raw) as TrialOperations;
    return { ...DEFAULT_TRIAL_OPERATIONS, ...parsed };
  } catch {
    return DEFAULT_TRIAL_OPERATIONS;
  }
}

function saveOps(ops: TrialOperations) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
}

export function useTrialOperations() {
  const [ops, setOps] = useState<TrialOperations>(loadOps);

  useEffect(() => {
    saveOps(ops);
  }, [ops]);

  const updateShipment = useCallback((patch: Partial<Shipment>) => {
    setOps((prev) => ({
      ...prev,
      shipment: { ...prev.shipment, ...patch },
    }));
  }, []);

  const updateDrugSupply = useCallback((patch: Partial<DrugSupply>) => {
    setOps((prev) => {
      const next = { ...prev.drugSupply, ...patch };
      const discrepancy =
        next.bottlesSupplied != null &&
        next.bottlesReceived != null &&
        next.bottlesSupplied !== next.bottlesReceived;
      return {
        ...prev,
        drugSupply: { ...next, inventoryDiscrepancy: discrepancy },
      };
    });
  }, []);

  const updateStorage = useCallback((patch: Partial<StorageConditions>) => {
    setOps((prev) => ({
      ...prev,
      storage: { ...prev.storage, ...patch },
    }));
  }, []);

  const updateProtocol = useCallback((patch: Partial<ProtocolLabelInfo>) => {
    setOps((prev) => ({
      ...prev,
      protocol: { ...prev.protocol, ...patch },
    }));
  }, []);

  const updateChecklistItem = useCallback(
    (id: string, patch: Partial<ChecklistItem>, userEmail: string) => {
      setOps((prev) => ({
        ...prev,
        checklist: prev.checklist.map((item) =>
          item.id === id
            ? {
                ...item,
                ...patch,
                lastUpdated: new Date().toISOString(),
                updatedBy: userEmail,
              }
            : item
        ),
      }));
    },
    []
  );

  const addAdminTask = useCallback((task: Omit<AdminTask, 'id' | 'createdAt'>) => {
    setOps((prev) => ({
      ...prev,
      adminTasks: [
        ...prev.adminTasks,
        {
          ...task,
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const updateAdminTask = useCallback((id: string, patch: Partial<AdminTask>) => {
    setOps((prev) => ({
      ...prev,
      adminTasks: prev.adminTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const deleteAdminTask = useCallback((id: string) => {
    setOps((prev) => ({
      ...prev,
      adminTasks: prev.adminTasks.filter((t) => t.id !== id),
    }));
  }, []);

  const setSiteReadinessOverride = useCallback(
    (
      status: TrialReadinessOverallStatus | null,
      by: string | null,
      reason: string | null
    ) => {
      setOps((prev) => ({
        ...prev,
        siteReadinessOverride: status,
        siteReadinessOverrideBy: by,
        siteReadinessOverrideDate: status ? new Date().toISOString() : null,
        siteReadinessOverrideReason: reason,
      }));
    },
    []
  );

  const resetAll = useCallback(() => {
    setOps(DEFAULT_TRIAL_OPERATIONS);
  }, []);

  const computedReadiness = useMemo(() => {
    const s = ops.shipment;
    const d = ops.drugSupply;
    const st = ops.storage;
    const p = ops.protocol;
    const c = ops.checklist;

    if (ops.siteReadinessOverride) {
      return {
        overall: ops.siteReadinessOverride,
        overridden: true,
        productShipped: s.shipmentStatus !== 'pending_dispatch',
        productDelivered: s.shipmentStatus === 'delivered' || s.shipmentStatus === 'received_by_clinic',
        productReceived: s.receivedByClinic,
        inventoryConfirmed:
          d.bottlesReceived != null &&
          d.bottlesRemaining != null &&
          !d.inventoryDiscrepancy,
        storageConfirmed: st.storageConfirmed && st.storageConfirmationStatus === 'confirmed_compliant',
        protocolApproved: p.protocolApproved,
        adminProcedureApproved: p.administrationProcedureStatus === 'complete',
        infusionTimeConfirmed: p.infusionTimeConfirmed === true,
        caseEnrolmentOpen: p.protocolApproved && s.receivedByClinic,
        unresolvedIssues: c.filter((i) => i.status === 'issue').length,
        pendingItems: c.filter((i) => i.status === 'pending').length,
      };
    }

    const productShipped = s.shipmentStatus !== 'pending_dispatch';
    const productDelivered = s.shipmentStatus === 'delivered' || s.shipmentStatus === 'received_by_clinic';
    const productReceived = s.receivedByClinic;
    const inventoryConfirmed =
      d.bottlesReceived != null && d.bottlesRemaining != null && !d.inventoryDiscrepancy;
    const storageConfirmed = st.storageConfirmed && st.storageConfirmationStatus === 'confirmed_compliant';
    const protocolApproved = p.protocolApproved;
    const adminProcedureApproved = p.administrationProcedureStatus === 'complete';
    const infusionTimeConfirmed = p.infusionTimeConfirmed === true;
    const caseEnrolmentOpen = protocolApproved && productReceived;

    let overall: TrialReadinessOverallStatus = 'not_ready';
    if (!productShipped) overall = 'awaiting_shipment';
    else if (!productDelivered) overall = 'awaiting_delivery';
    else if (!productReceived) overall = 'awaiting_delivery';
    else if (!storageConfirmed) overall = 'awaiting_storage_confirmation';
    else if (!protocolApproved || !infusionTimeConfirmed) overall = 'protocol_clarification_required';
    else if (productReceived && storageConfirmed && protocolApproved && inventoryConfirmed) {
      overall = caseEnrolmentOpen ? 'active' : 'ready_for_enrolment';
    }

    const unresolvedIssues = c.filter((i) => i.status === 'issue').length;
    const pendingItems = c.filter((i) => i.status === 'pending').length;

    return {
      overall,
      overridden: false,
      productShipped,
      productDelivered,
      productReceived,
      inventoryConfirmed,
      storageConfirmed,
      protocolApproved,
      adminProcedureApproved,
      infusionTimeConfirmed,
      caseEnrolmentOpen,
      unresolvedIssues,
      pendingItems,
    };
  }, [ops]);

  return {
    ops,
    computedReadiness,
    updateShipment,
    updateDrugSupply,
    updateStorage,
    updateProtocol,
    updateChecklistItem,
    addAdminTask,
    updateAdminTask,
    deleteAdminTask,
    setSiteReadinessOverride,
    resetAll,
  };
}
