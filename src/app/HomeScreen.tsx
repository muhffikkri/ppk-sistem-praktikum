import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { PanResponder, View } from 'react-native';

import { AssistantHome } from '../features/assistant/AssistantHome';
import { StudentHome } from '../features/student/StudentHome';
import { useAuth } from '../state';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const DOCK_ORDER = ['Home', 'Schedule', 'Attendance', 'Profile'] as const;

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const isAssistant = user?.role === 'assistant';

  const routes = useMemo<Record<(typeof DOCK_ORDER)[number], keyof RootStackParamList>>(
    () => ({
      Home: 'Home',
      Schedule: isAssistant ? 'AssistantSchedule' : 'StudentSchedule',
      Attendance: isAssistant ? 'AssistantAllAttendance' : 'StudentAttendanceHistory',
      Profile: 'Profile',
    }),
    [isAssistant],
  );

  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) < 72 || Math.abs(g.dx) < Math.abs(g.dy) * 1.2) return;
          const dir = g.dx < 0 ? 1 : -1;
          const nextIdx = (0 + dir + DOCK_ORDER.length) % DOCK_ORDER.length;
          const target = routes[DOCK_ORDER[nextIdx]];
          navigation.reset({ index: 0, routes: [{ name: target }] });
        },
      }).panHandlers,
    [navigation, routes],
  );

  return (
    <View style={{ flex: 1 }} {...panHandlers}>
      {isAssistant ? (
        <AssistantHome navigation={navigation} />
      ) : (
        <StudentHome navigation={navigation} />
      )}
    </View>
  );
}
