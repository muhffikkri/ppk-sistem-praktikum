// Keep route names and params aligned with docs/sprint-2-shared-contract.md.
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  StudentSchedule: undefined;
  StudentSessionDetail: { sessionId: string };
  StudentAttendanceHistory: undefined;
  StudentLeaveRequestForm: { sessionId: string };
  StudentLeaveList: undefined;
  AssistantSchedule: undefined;
  AssistantSessionDetail: { sessionId: string };
  AssistantAttendanceRoster: { sessionId: string };
  AssistantModuleList: undefined;
  AssistantSettings: undefined;
  AssistantAllSessions: undefined;
  AssistantAllAttendance: undefined;
  AssistantClassList: undefined;
  AssistantClassForm: { classId?: string };
  AssistantSessionForm: { classId?: string; sessionId?: string };
  AssistantLeaveReviewList: undefined;
  StudentAllSessions: undefined;
  StudentAllAttendance: undefined;
  Calendar: undefined;
  Profile: undefined;
  ProfileEdit: undefined;
};

export type ActorPov = 'praktikan' | 'asisten' | 'admin';

export const POVLABEL: Record<ActorPov, string> = {
  praktikan: 'Praktikan',
  asisten: 'Asisten',
  admin: 'Admin',
};
