import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation';
import { StudentLeaveSessionPicker } from './StudentLeaveSessionPicker';
import { Screen } from '../../shared/ui';
import { ListFeedback, RequestCard, styles } from './components';
import { useStudentLeaveViewModel } from './useStudentLeaveViewModel';

export function StudentLeaveListScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'StudentLeaveList'>) {
  const vm = useStudentLeaveViewModel();
  return (
    <Screen>
      <Text style={styles.title}>Pengajuan Izin Saya</Text>
      <StudentLeaveSessionPicker
        onSelect={(sessionId) =>
          navigation.navigate('StudentLeaveRequestForm', { sessionId })
        }
      />
      <Text style={styles.subtitle}>Riwayat Pengajuan</Text>
      <ListFeedback {...vm} empty={vm.leaveRequests.length === 0} />
      {vm.leaveRequests.map((item) => (
        <RequestCard key={item.id} item={item} />
      ))}
    </Screen>
  );
}
