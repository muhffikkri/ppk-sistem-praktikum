import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation';
import {
  EmptyState,
  Screen,
  SectionHeader,
  Stack,
  BackButton,
} from '../../shared/ui';
import { ListFeedback, RequestCard } from './components';
import { StudentLeaveSessionPicker } from './StudentLeaveSessionPicker';
import { useStudentLeaveViewModel } from './useStudentLeaveViewModel';

export function StudentLeaveListScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'StudentLeaveList'>) {
  const vm = useStudentLeaveViewModel();
  return (
    <Screen>
      <BackButton onPress={() => navigation.goBack()} />

      <StudentLeaveSessionPicker
        onSelect={(sessionId) =>
          navigation.navigate('StudentLeaveRequestForm', { sessionId })
        }
      />
      <Stack gap="md">
        <SectionHeader title="Riwayat pengajuan" />
        <ListFeedback
          {...vm}
          empty={vm.loading && vm.leaveRequests.length === 0}
        />
        {!vm.loading && !vm.error && vm.leaveRequests.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="Belum ada pengajuan izin"
            description="Pengajuanmu akan muncul di sini."
          />
        ) : null}
        {vm.leaveRequests.map((item) => (
          <RequestCard key={item.id} item={item} />
        ))}
      </Stack>
    </Screen>
  );
}
