import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { canManageLabMaster, isAssistantRole } from '../domain/asprakScope';
import { AssistantHome } from '../features/assistant/AssistantHome';
import { AslabHome } from '../features/dashboard/AslabHome';
import { StudentHome } from '../features/student/StudentHome';
import { useAuth } from '../state';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'DockTabs'>;

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  if (canManageLabMaster(user?.role)) {
    return <AslabHome navigation={navigation} />;
  }
  return isAssistantRole(user?.role) ? (
    <AssistantHome navigation={navigation} />
  ) : (
    <StudentHome navigation={navigation} />
  );
}
