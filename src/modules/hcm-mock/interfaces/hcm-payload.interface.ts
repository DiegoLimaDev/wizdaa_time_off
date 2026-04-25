// src/modules/hcm-mock/interfaces/hcm-payload.interface.ts

export interface HcmSyncPayload {
  // Unique identifier for the employee
  employeeId: string;

  // Start date of the absence (ISO format)
  startDate: string;

  // End date of the absence (ISO format)
  endDate: string;

  // Total number of days requested
  days: number;
}
