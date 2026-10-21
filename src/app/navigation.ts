// Keep route names and params aligned with docs/shared-contract.md.
export type RootStackParamList = {
  RoleSelect: undefined;
  StudentSchedule: undefined;
  StudentSessionDetail: { sessionId: string };
  StudentAttendanceHistory: undefined;
  AssistantSchedule: undefined;
  AssistantSessionDetail: { sessionId: string };
  AssistantAttendanceRoster: { sessionId: string };
};
