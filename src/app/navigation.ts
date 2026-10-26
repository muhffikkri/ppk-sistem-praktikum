// Keep route names and params aligned with docs/shared-contract.md.
export type RootStackParamList = {
  Home: undefined;
  StudentSchedule: undefined;
  StudentSessionDetail: { sessionId: string };
  StudentAttendanceHistory: undefined;
  AssistantSchedule: undefined;
  AssistantSessionDetail: { sessionId: string };
  AssistantAttendanceRoster: { sessionId: string };
  AssistantModuleList: undefined;
  AssistantSettings: undefined;
  Profile: undefined;
};

export type ActorPov = 'praktikan' | 'asisten';

export const POVLABEL: Record<ActorPov, string> = {
  praktikan: 'Praktikan',
  asisten: 'Asisten',
};
