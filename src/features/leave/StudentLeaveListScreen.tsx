import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';
import type { RootStackParamList } from '../../app/navigation';
import { Header, Screen, SectionHeader, spacing } from '../../shared/ui';
import { ListFeedback, RequestCard } from './components';
import { StudentLeaveSessionPicker } from './StudentLeaveSessionPicker';
import { useStudentLeaveViewModel } from './useStudentLeaveViewModel';

export function StudentLeaveListScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'StudentLeaveList'>) {
  const vm = useStudentLeaveViewModel();
  return (
    <Screen>
      <Header
        title="Izin saya"
        description="Ajukan izin per sesi dan pantau statusnya."
      />
      <StudentLeaveSessionPicker
        onSelect={(sessionId) =>
          navigation.navigate('StudentLeaveRequestForm', { sessionId })
        }
      />
      <View style={{ gap: spacing.md }}>
        <SectionHeader title="Riwayat pengajuan" />
        <ListFeedback {...vm} empty={vm.leaveRequests.length === 0} />
        {vm.leaveRequests.map((item) => (
          <RequestCard key={item.id} item={item} />
        ))}
      </View>
    </Screen>
  );
}
