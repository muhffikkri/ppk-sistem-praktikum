import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  notificationRoute,
  type InboxNotification,
} from '../domain/notificationTypes';
import { DOCK_TABS, isDockTab } from './dockTabs';

/** Route stack yang dihapus karena duplikat halaman dock (#52). */
const REMOVED_ROUTES = [
  'Home',
  'Profile',
  'StudentSchedule',
  'StudentAttendanceHistory',
  'AssistantSchedule',
  'AssistantAllAttendance',
  'StudentAllSessions',
  'StudentAllAttendance',
];

describe('dock tabs (#52)', () => {
  it('mengenali empat tab dock', () => {
    assert.deepEqual(
      [...DOCK_TABS],
      ['Home', 'Schedule', 'Attendance', 'Profile'],
    );
    assert.equal(isDockTab('Schedule'), true);
    assert.equal(isDockTab('StudentSchedule'), false);
    assert.equal(isDockTab(undefined), false);
  });

  it('tujuan notifikasi tidak memakai route yang sudah dihapus', () => {
    const types: InboxNotification['type'][] = [
      'session_opened',
      'session_scheduled',
      'schedule_changed',
      'leave_decided',
      'fine_issued',
      'payment_success',
      'payment_failed',
    ];
    for (const type of types) {
      const route = notificationRoute({
        type,
        sessionId: 's1',
        leaveId: 'l1',
        fineId: 'f1',
      });
      if (route) assert.ok(!REMOVED_ROUTES.includes(route.screen), type);
    }
  });
});
