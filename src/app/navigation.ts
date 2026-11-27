import type { ActorRole } from '../state/AuthContext';
import type { DockTabKey } from './dockTabs';

// Keep route names and params aligned with docs/sprint-2-shared-contract.md.
export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  RoleSelection: undefined;
};

/**
 * Halaman dock (Beranda, Jadwal, Presensi, Akun) bukan route stack: dibuka
 * lewat `DockTabs` dengan param `tab` (lihat `openDockTab`).
 */
export type RootStackParamList = {
  DockTabs: { tab?: DockTabKey } | undefined;
  StudentSessionDetail: { sessionId: string };
  StudentCheckIn: { sessionId: string; qrToken?: string };
  StudentLeaveRequestForm: { sessionId: string };
  StudentLeaveList: undefined;
  AssistantSessionDetail: { sessionId: string };
  AssistantSessionQr: { sessionId: string };
  AssistantAttendanceRoster: { sessionId: string };
  AssistantAllSessions: undefined;
  AssistantClassList: undefined;
  AssistantClassForm: { classId?: string };
  AssistantSessionForm: { classId?: string; sessionId?: string };
  AssistantLeaveReviewList: undefined;
  AssistantLabList: undefined;
  AssistantLabForm: { labId?: string };
  AslabLabDistribution: { labId?: string } | undefined;
  AslabLabImport: undefined;
  StudentFineList: undefined;
  StudentFineDetail: { fineId: string };
  StudentPaymentHistory: undefined;
  Calendar: undefined;
  ProfileEdit: undefined;
  Notifications: undefined;
  LabMaps: undefined;
  /** `fromDock` marks the navbar FAB entry, which keeps the root top bar. */
  BarcodeScan: { fromDock?: boolean } | undefined;
};

export const POVLABEL: Record<ActorRole, string> = {
  praktikan: 'Praktikan',
  asisten: 'Asisten',
};
