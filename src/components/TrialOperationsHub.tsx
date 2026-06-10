import { useTrialOperations } from '@/hooks/useTrialOperations';
import { useAuth } from '@/context/AuthContext';
import { TrialReadinessStatusPanel } from './TrialReadinessStatusPanel';
import { ProductShipmentTrackingCard } from './ProductShipmentTrackingCard';
import { DrugSupplyInventoryCard } from './DrugSupplyInventoryCard';
import { StorageConditionsCard } from './StorageConditionsCard';
import { ProtocolLabelInfoCard } from './ProtocolLabelInfoCard';
import { AdministrationProcedureChecklist, ProtocolCompletenessWarningPanel } from './AdministrationProcedureChecklist';
import { AdminFollowUpTasksPanel } from './AdminFollowUpTasksPanel';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TrialOperationsHub() {
  const auth = useAuth();
  const isAdmin = auth.role === 'admin';
  const userEmail = auth.email || 'unknown';

  const {
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
  } = useTrialOperations();

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 pb-8">
        <TrialReadinessStatusPanel
          readiness={computedReadiness}
          overridden={computedReadiness.overridden}
          overrideBy={ops.siteReadinessOverrideBy}
          overrideReason={ops.siteReadinessOverrideReason}
          isAdmin={isAdmin}
          onOverride={(status, reason) => setSiteReadinessOverride(status, isAdmin ? userEmail : null, reason)}
        />

        <ProtocolCompletenessWarningPanel checklist={ops.checklist} protocol={ops.protocol} />

        <ProductShipmentTrackingCard
          shipment={ops.shipment}
          isAdmin={isAdmin}
          onUpdate={updateShipment}
          vetEmail={isAdmin ? undefined : userEmail}
        />

        <DrugSupplyInventoryCard
          drugSupply={ops.drugSupply}
          isAdmin={isAdmin}
          onUpdate={updateDrugSupply}
        />

        <StorageConditionsCard
          storage={ops.storage}
          isAdmin={isAdmin}
          onUpdate={updateStorage}
          vetEmail={isAdmin ? undefined : userEmail}
        />

        <ProtocolLabelInfoCard
          protocol={ops.protocol}
          isAdmin={isAdmin}
          onUpdate={updateProtocol}
        />

        <AdministrationProcedureChecklist
          checklist={ops.checklist}
          isAdmin={isAdmin}
          onUpdateItem={updateChecklistItem}
          userEmail={userEmail}
        />

        {isAdmin && (
          <AdminFollowUpTasksPanel
            tasks={ops.adminTasks}
            onAdd={addAdminTask}
            onUpdate={updateAdminTask}
            onDelete={deleteAdminTask}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </ScrollArea>
  );
}
