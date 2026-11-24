import type { ActorRole } from '../state/AuthContext';

// Keep route names and params aligned with docs/sprint-2-shared-contract.md.
export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  RoleSelection: undefined;
};

export type RootStackParamList = {
  DockTabs: { tab?: 'Home' | 'Schedule' | 'Attendance' | 'Profile' } | undefined;
  Home: undefined;
  StudentSchedule: undefined;
  StudentSessionDetail: { sessionId: string };
  StudentCheckIn: { sessionId: string };
  StudentAttendanceHistory: undefined;
  StudentLeaveRequestForm: { sessionId: string };
  StudentLeaveList: undefined;
  AssistantSchedule: undefined;
  AssistantSessionDetail: { sessionId: string };
  AssistantAttendanceRoster: { sessionId: string };
  AssistantAllSessions: undefined;
  AssistantAllAttendance: undefined;
  AssistantClassList: undefined;
  AssistantClassForm: { classId?: string };
  AssistantSessionForm: { classId?: string; sessionId?: string };
  AssistantLeaveReviewList: undefined;
  AssistantLabList: undefined;
  AssistantLabForm: { labId?: string };
  StudentAllSessions: undefined;
  StudentAllAttendance: undefined;
  Calendar: undefined;
  Profile: undefined;
  ProfileEdit: undefined;
  Notifications: undefined;
  LabMaps: undefined;
};

export const POVLABEL: Record<ActorRole, string> = {
  praktikan: 'Praktikan',
  asisten: 'Asisten',
};
