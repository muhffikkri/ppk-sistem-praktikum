import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AssistantHome } from '../features/assistant/AssistantHome';
import { StudentHome } from '../features/student/StudentHome';
import { useAuth } from '../state';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  return user?.role === 'assistant' ? (
    <AssistantHome navigation={navigation} />
  ) : (
    <StudentHome navigation={navigation} />
  );
}
