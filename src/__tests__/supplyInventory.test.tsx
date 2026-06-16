import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMutateAction } from '@uibakery/data';
import simpleRegisterVetAction from '@/actions/simpleRegisterVet';
import createSupplyShipmentAction from '@/actions/createSupplyShipment';
import addTreatmentAction from '@/actions/addTreatment';

describe('PTP-102 supply and inventory workflow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a shipment with a unique batch and blocks duplicates', async () => {
    const { result: registerResult } = renderHook(() => useMutateAction(simpleRegisterVetAction));
    await act(async () => {
      await registerResult.current[0]({
        fullName: 'Dr Trial Vet',
        email: 'trialvet@example.com',
        passwordHash: 'password',
        hospitalAffiliation: 'Trial Vet Clinic',
      });
    });

    const vets = JSON.parse(localStorage.getItem('ptp102_mock_vets') || '[]');
    const vet = vets.find((v: any) => v.email === 'trialvet@example.com');
    expect(vet).toBeDefined();

    const { result } = renderHook(() => useMutateAction(createSupplyShipmentAction));
    const [createShipment] = result.current;

    await act(async () => {
      await createShipment({
        productName: 'PTP-102',
        batchLotNumber: 'X775',
        quantityVials: 10,
        shippedToVeterinarianId: vet.id,
        shippedToVeterinarianEmail: vet.email,
        shippedToVeterinarianName: vet.full_name,
        shipmentStatus: 'shipped',
      });
    });

    const shipments = JSON.parse(localStorage.getItem('ptp102_mock_shipments') || '[]');
    const created = shipments.find((s: any) => s.batch_lot_number === 'X775');
    expect(created).toBeDefined();
    expect(created).toMatchObject({
      product_name: 'PTP-102',
      batch_lot_number: 'X775',
      quantity_vials: 10,
      remaining_quantity: 10,
      shipment_status: 'shipped',
    });

    await act(async () => {
      await expect(
        createShipment({
          batchLotNumber: 'X775',
          quantityVials: 5,
          shippedToVeterinarianId: vet.id,
        })
      ).rejects.toThrow('already in use');
    });
  });

  it('decrements remaining inventory when a clinic records a treatment', async () => {
    const { result: registerResult } = renderHook(() => useMutateAction(simpleRegisterVetAction));
    await act(async () => {
      await registerResult.current[0]({
        fullName: 'Dr Trial Vet',
        email: 'trialvet@example.com',
        passwordHash: 'password',
        hospitalAffiliation: 'Trial Vet Clinic',
      });
    });

    const vets = JSON.parse(localStorage.getItem('ptp102_mock_vets') || '[]');
    const vet = vets.find((v: any) => v.email === 'trialvet@example.com');

    const { result: createResult } = renderHook(() => useMutateAction(createSupplyShipmentAction));
    await act(async () => {
      await createResult.current[0]({
        productName: 'PTP-102',
        batchLotNumber: 'X776',
        quantityVials: 10,
        bottleVolumeMl: 1000,
        shippedToVeterinarianId: vet.id,
        shippedToVeterinarianEmail: vet.email,
        shippedToVeterinarianName: vet.full_name,
        shipmentStatus: 'received',
      });
    });

    const patients = JSON.parse(localStorage.getItem('ptp102_mock_patients') || '[]');
    const patient = patients[0] ?? { id: 999 };

    localStorage.setItem('veterinarian_email', vet.email);
    const { result: treatmentResult } = renderHook(() => useMutateAction(addTreatmentAction));
    await act(async () => {
      await treatmentResult.current[0]({
        patientId: patient.id,
        administrationDatetime: new Date().toISOString(),
        dosageMg: 2500,
        route: 'IV',
        protocolHour: 0,
        veterinarianName: vet.full_name,
        totalVolumeMl: 500,
        batchNumber: 'X776',
      });
    });

    const shipmentsAfter = JSON.parse(localStorage.getItem('ptp102_mock_shipments') || '[]');
    const shipment = shipmentsAfter.find((s: any) => s.batch_lot_number === 'X776');
    expect(shipment.remaining_quantity).toBe(9.5);
    expect(shipment.shipment_status).toBe('in_use');

    const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const dispenseLogs = logs.filter((l: any) => l.action === 'DISPENSE' && l.entityType === 'shipment');
    expect(dispenseLogs.length).toBeGreaterThan(0);
    expect(dispenseLogs[0].newValue).toContain('9.5');
  });

  it('clamps remaining inventory at zero and never goes negative', async () => {
    const { result: registerResult } = renderHook(() => useMutateAction(simpleRegisterVetAction));
    await act(async () => {
      await registerResult.current[0]({
        fullName: 'Dr Trial Vet',
        email: 'trialvet@example.com',
        passwordHash: 'password',
        hospitalAffiliation: 'Trial Vet Clinic',
      });
    });

    const vets = JSON.parse(localStorage.getItem('ptp102_mock_vets') || '[]');
    const vet = vets.find((v: any) => v.email === 'trialvet@example.com');

    const { result: createResult } = renderHook(() => useMutateAction(createSupplyShipmentAction));
    await act(async () => {
      await createResult.current[0]({
        batchLotNumber: 'X777',
        quantityVials: 1,
        bottleVolumeMl: 1000,
        shippedToVeterinarianId: vet.id,
        shippedToVeterinarianEmail: vet.email,
        shippedToVeterinarianName: vet.full_name,
        shipmentStatus: 'received',
      });
    });

    const patients = JSON.parse(localStorage.getItem('ptp102_mock_patients') || '[]');
    const patient = patients[0] ?? { id: 999 };
    localStorage.setItem('veterinarian_email', vet.email);

    const { result: treatmentResult } = renderHook(() => useMutateAction(addTreatmentAction));
    await act(async () => {
      await treatmentResult.current[0]({
        patientId: patient.id,
        administrationDatetime: new Date().toISOString(),
        dosageMg: 7500,
        route: 'IV',
        protocolHour: 0,
        veterinarianName: vet.full_name,
        totalVolumeMl: 1500,
        batchNumber: 'X777',
      });
    });

    const shipmentsAfter = JSON.parse(localStorage.getItem('ptp102_mock_shipments') || '[]');
    const shipment = shipmentsAfter.find((s: any) => s.batch_lot_number === 'X777');
    expect(shipment.remaining_quantity).toBe(0);
    expect(shipment.shipment_status).toBe('depleted');
  });
});
