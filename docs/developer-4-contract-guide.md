# Panduan Penggunaan Kontrak & State (Untuk Tim - Orang 1, 2, dan 3)

Dokumen ini disusun oleh **Orang 4 (Model Lokal, Fixture, dan Aturan State)** sebagai referensi integrasi komponen UI dan navigasi dengan model domain dan state demo.

---

## 1. Ringkasan Modul yang Disediakan

| Modul | Path | Deskripsi |
| :--- | :--- | :--- |
| **Domain Types & Rules** | `src/domain/` | Tipe data (`Session`, `AttendanceRecord`, dll.) dan fungsi validasi aturan bisnis (`openSessionRule`, `closeSessionRule`, `checkInRule`). |
| **Fixtures Data** | `src/data/fixtures/` | Data dummy jadwal dan kehadiran mandiri untuk Asisten dan Praktikan. |
| **State & Context** | `src/state/` | Provider React Context (`AssistantDemoProvider`, `StudentDemoProvider`) dan ViewModel hooks (`useAssistantSessionsViewModel`, `useStudentAttendanceViewModel`). |

---

## 2. Panduan untuk Orang 1 (Navigator & Provider Setup)

Bungkus navigator masing-masing role dengan provider yang sesuai di `App.tsx` atau stack navigator. State disimpan di tingkat provider sehingga navigasi antar-halaman tidak akan mereset data.

```tsx
import React from 'react';
import { AssistantDemoProvider, StudentDemoProvider } from './src/state';
// ... import screen dan navigator ...

// Saat demo Asisten dipilih:
export function AssistantNavigator() {
  return (
    <AssistantDemoProvider>
      <Stack.Navigator>
        <Stack.Screen name="AssistantSchedule" component={AssistantScheduleScreen} />
        <Stack.Screen name="AssistantSessionDetail" component={AssistantSessionDetailScreen} />
        <Stack.Screen name="AssistantAttendanceRoster" component={AssistantAttendanceRosterScreen} />
      </Stack.Navigator>
    </AssistantDemoProvider>
  );
}

// Saat demo Praktikan dipilih:
export function StudentNavigator() {
  return (
    <StudentDemoProvider>
      <Stack.Navigator>
        <Stack.Screen name="StudentSchedule" component={StudentScheduleScreen} />
        <Stack.Screen name="StudentSessionDetail" component={StudentSessionDetailScreen} />
        <Stack.Screen name="StudentAttendanceHistory" component={StudentAttendanceHistoryScreen} />
      </Stack.Navigator>
    </StudentDemoProvider>
  );
}
```

---

## 3. Panduan untuk Orang 2 (Alur Praktikan)

Orang 2 cukup menggunakan hook `useStudentAttendanceViewModel()` di dalam komponen screen atau custom hook praktikan.

### Nilai & Fungsi dari `useStudentAttendanceViewModel`:
- `sessions`: Daftar sesi praktikan (`Session[]`).
- `currentStudent`: Identitas praktikan aktif demo (`DemoStudent`).
- `attendanceHistory`: Riwayat kehadiran praktikan demo (`AttendanceRecord[]`).
- `getSessionById(sessionId)`: Mengambil detail satu sesi.
- `getAttendanceForSession(sessionId)`: Cek apakah praktikan sudah presensi di sesi ini (mengembalikan `AttendanceRecord` atau `undefined`).
- `checkIn(sessionId)`: Melakukan presensi. Mengembalikan `{ ok: true }` atau `{ ok: false, reason: 'invalid_status' | 'already_checked_in' | 'session_not_found' }`.

### Contoh Implementasi di `StudentSessionDetailScreen`:

```tsx
import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { useStudentAttendanceViewModel } from '../../state';

export function StudentSessionDetailScreen({ route }: { route: { params: { sessionId: string } } }) {
  const { sessionId } = route.params;
  const { getSessionById, getAttendanceForSession, checkIn } = useStudentAttendanceViewModel();

  const session = getSessionById(sessionId);
  const attendance = getAttendanceForSession(sessionId);

  if (!session) {
    return <Text>Sesi tidak ditemukan</Text>;
  }

  const isAlreadyCheckedIn = attendance !== undefined;
  const isOpen = session.status === 'open';

  const handleCheckIn = () => {
    const result = checkIn(sessionId);
    if (result.ok) {
      Alert.alert('Sukses', 'Presensi berhasil dicatat!');
    } else {
      if (result.reason === 'already_checked_in') {
        Alert.alert('Perhatian', 'Anda sudah melakukan presensi pada sesi ini.');
      } else if (result.reason === 'invalid_status') {
        Alert.alert('Gagal', 'Sesi belum dibuka atau sudah ditutup.');
      }
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{session.courseName}</Text>
      <Text>Kelas: {session.groupName}</Text>
      <Text>Status Sesi: {session.status}</Text>

      {isAlreadyCheckedIn ? (
        <View style={{ marginTop: 16, backgroundColor: '#e6f4ea', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#137333', fontWeight: 'bold' }}>✓ Anda Sudah Hadir</Text>
          <Text>Waktu: {new Date(attendance.checkedInAt).toLocaleTimeString()}</Text>
        </View>
      ) : (
        <View style={{ marginTop: 16 }}>
          <Button
            title={isOpen ? "Presensi Sekarang" : "Sesi Belum Dibuka"}
            disabled={!isOpen}
            onPress={handleCheckIn}
          />
        </View>
      )}
    </View>
  );
}
```

---

## 4. Panduan untuk Orang 3 (Alur Asisten)

Orang 3 menggunakan hook `useAssistantSessionsViewModel()` di dalam screen asisten.

### Nilai & Fungsi dari `useAssistantSessionsViewModel`:
- `sessions`: Daftar sesi asisten (`Session[]`).
- `getSessionById(sessionId)`: Mengambil detail satu sesi.
- `getAttendanceForSession(sessionId)`: Mengambil daftar praktikan yang sudah hadir pada sesi (`AttendanceRecord[]`).
- `openSession(sessionId)`: Membuka sesi terjadwal (`scheduled` → `open`). Mengembalikan `{ ok: true }` atau `{ ok: false, reason: ... }`.
- `closeSession(sessionId)`: Menutup sesi terbuka (`open` → `closed`). Mengembalikan `{ ok: true }` atau `{ ok: false, reason: ... }`.

### Contoh Implementasi di `AssistantSessionDetailScreen`:

```tsx
import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { useAssistantSessionsViewModel } from '../../state';

export function AssistantSessionDetailScreen({ route, navigation }: any) {
  const { sessionId } = route.params;
  const { getSessionById, getAttendanceForSession, openSession, closeSession } = useAssistantSessionsViewModel();

  const session = getSessionById(sessionId);
  const attendees = getAttendanceForSession(sessionId);

  if (!session) {
    return <Text>Sesi tidak ditemukan</Text>;
  }

  const handleOpen = () => {
    const res = openSession(sessionId);
    if (res.ok) {
      Alert.alert('Berhasil', 'Sesi praktikum telah dibuka.');
    } else {
      Alert.alert('Gagal', `Tidak dapat membuka sesi (${res.reason}).`);
    }
  };

  const handleClose = () => {
    const res = closeSession(sessionId);
    if (res.ok) {
      Alert.alert('Berhasil', 'Sesi praktikum telah ditutup.');
    } else {
      Alert.alert('Gagal', `Tidak dapat menutup sesi (${res.reason}).`);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{session.courseName}</Text>
      <Text>Status: {session.status}</Text>
      <Text>Jumlah Hadir: {attendees.length} Praktikan</Text>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        {session.status === 'scheduled' && (
          <Button title="Buka Sesi" onPress={handleOpen} />
        )}
        {session.status === 'open' && (
          <Button title="Tutup Sesi" color="red" onPress={handleClose} />
        )}
        <Button
          title="Lihat Rekap Presensi"
          onPress={() => navigation.navigate('AssistantAttendanceRoster', { sessionId })}
        />
      </View>
    </View>
  );
}
```

---

## 5. Ringkasan Status & Perilaku Aturan Domain

| Transisi / Aksi | Kondisi Awal | Status Berhasil | Alasan Jika Gagal |
| :--- | :--- | :--- | :--- |
| `openSession` | `scheduled` | `open` (openedAt terisi) | `invalid_status` (bila open/closed), `session_not_found` |
| `closeSession` | `open` | `closed` (closedAt terisi) | `invalid_status` (bila scheduled/closed), `session_not_found` |
| `checkIn` | `open` & belum pernah presensi | Catatan presensi tersimpan | `invalid_status` (jika bukan open), `already_checked_in` (jika duplikat), `session_not_found` |

Semua aturan ini sudah diuji dan diverifikasi secara otomatis (`npx tsx scripts/verify-contracts.ts`).
