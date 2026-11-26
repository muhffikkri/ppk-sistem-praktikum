import type { ActorRole } from '../state/AuthContext';

// Keep route names and params aligned with docs/sprint-2-shared-contract.md.
export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  RoleSelection: undefined;
};

export type RootStackParamList = {
  DockTabs:
    { tab?: 'Home' | 'Schedule' | 'Attendance' | 'Profile' } | undefined;
  Home: undefined;
  StudentSchedule: undefined;
  StudentSessionDetail: { sessionId: string };
  StudentCheckIn: { sessionId: string; qrToken?: string };
  StudentAttendanceHistory: undefined;
  StudentLeaveRequestForm: { sessionId: string };
  StudentLeaveList: undefined;
  AssistantSchedule: undefined;
  AssistantSessionDetail: { sessionId: string };
  AssistantSessionQr: { sessionId: string };
  AssistantAttendanceRoster: { sessionId: string };
  AssistantAllSessions: undefined;
  AssistantAllAttendance: undefined;
  AssistantClassList: undefined;
  AssistantClassForm: { classId?: string };
  AssistantSessionForm: { classId?: string; sessionId?: string };
  AssistantLeaveReviewList: undefined;
  AssistantLabList: undefined;
  AssistantLabForm: { labId?: string };
  AslabLabDistribution: { labId?: string } | undefined;
  AslabLabImport: undefined;
  StudentAllSessions: undefined;
  StudentAllAttendance: undefined;
  StudentFineList: undefined;
  StudentFineDetail: { fineId: string };
  StudentPaymentHistory: undefined;
  Calendar: undefined;
  Profile: undefined;
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
