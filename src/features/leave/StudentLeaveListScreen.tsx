import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';
import type { RootStackParamList } from '../../app/navigation';
import {
  EmptyState,
  Header,
  Screen,
  SectionHeader,
  spacing,
  TopBar,
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
      <TopBar onBack={() => navigation.goBack()} />
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
      </View>
    </Screen>
  );
}
