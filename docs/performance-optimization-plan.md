# Rencana Optimasi Performa — Transisi Cepat & Tombol Responsif

Branch: `perf/app-responsiveness` (dari `main` @ `7d58e4b`)

Tujuan: perpindahan tab dan layar terasa instan, dan setiap tombol memberi
umpan balik visual pada frame yang sama saat disentuh.

Akar masalahnya bukan animasi yang kurang bagus, tetapi **JS thread yang terlalu
sibuk**: setiap tap dock me-remount 4 layar, keempat layar tab selalu aktif,
value context dibuat baru setiap render, dan terlalu banyak listener Firestore
yang masing-masing memicu re-render seluruh aplikasi. Selama JS thread sibuk,
animasi berbasis JS dan state `pressed` pada `Pressable` ikut tertunda.

## 0. Aturan kerja

- Satu commit = satu perubahan logis, format Conventional Commits (`type(scope): ringkasan`), sama seperti riwayat repo.
- **Tanpa trailer `Co-Authored-By` atau atribusi AI/bot apa pun.** Author memakai `git config` milik developer.
- Dependensi baru **selalu** lewat `npx expo install <pkg>` (versi yang cocok dengan SDK 58), dan masuk ke commit yang sama dengan kode pertama yang memakainya, supaya tidak ada commit yang menambah dependensi tanpa pemakaian.
- Sebelum setiap commit kode: `npx tsc --noEmit`, `npm run lint`, `npm test` harus lulus.
- Semua pengukuran performa dilakukan di **build release/preview**, bukan Expo Go atau mode dev (mode dev jauh lebih lambat karena dev checks):
  `npx expo run:android --variant release` atau `npx eas-cli@latest build --profile preview`.
- Semua library baru di bawah ini (`react-native-pager-view`, `react-native-reanimated`, `react-native-worklets`, `expo-haptics`) sudah termasuk di Expo Go SDK 58, jadi `npm start` (Expo Go) tetap jalan. Dev client tetap perlu dibangun ulang setelah dependensi native baru ditambahkan.

## 1. Baseline (tanpa commit)

Ukur dulu sebelum mengubah apa pun, supaya hasil tiap fase bisa dibandingkan.

1. Build release Android di HP fisik kelas menengah.
2. Nyalakan *Perf Monitor* (menu dev di build dev-client) dan *React DevTools Profiler* (`j` di terminal Metro → Profiler, centang "Record why each component rendered").
3. Catat untuk akun praktikan dan asisten:
   - Waktu tap tab dock → konten tab tampil (rekam layar 60 fps, hitung frame).
   - Jumlah komponen yang re-render saat tap tab (Profiler).
   - FPS JS/UI saat swipe antar-tab dan saat membuka `StudentSessionDetail` / `AssistantSessionDetail`.
   - Jumlah re-render `HomeScreen` saat satu dokumen `attendance` berubah (presensi dari HP lain).
   - Jumlah listener Firestore aktif (log sementara di setiap `subscribe*`, jangan di-commit).
4. Simpan angka di tabel bagian 6.

## 2. Temuan & rencana per fase

Urutan fase = urutan prioritas (dampak terbesar dan risiko terendah duluan).

---

### Fase A — Navigasi tab (dampak terbesar)

#### A1. Tap dock me-reset stack dan me-remount 4 layar

Lokasi: `src/app/AppNavigator.tsx:245` (`onTabPress`).

Penyebab: `navigation.reset({ routes: [{ name: 'DockTabs', params }] })` tanpa
`key` membuat route baru, sehingga `DockTabsScreen` beserta Home, Jadwal,
Presensi, dan Akun di-unmount lalu di-mount ulang setiap tap. Animasi spring
juga tidak pernah jalan, karena `useState(() => new Animated.Value(-activeIndex * width))`
langsung mulai di posisi tujuan.

Perbaikan:
- Baca route aktif dari `navigation.getState()`.
- Kalau route aktif adalah `DockTabs` → `navigation.dispatch({ ...CommonActions.setParams({ tab }), source: dockRoute.key })`.
- Kalau sedang di layar detail → `navigation.popTo('DockTabs', { tab }, { merge: true })` (React Navigation 7 memakai `popTo` untuk kembali ke route yang ada; `navigate` tidak lagi kembali). Cek signature `popTo` di `@react-navigation/routers` 7.x saat implementasi.
- Jangan sentuh `reset` di tempat lain (tidak ada pemakaian lain).

Selesai bila: Profiler menunjukkan tidak ada mount baru `HomeScreen`/`ProfileScreen` saat tap tab; tombol dock dari layar detail kembali ke tab yang benar dan tombol back Android masih benar.

**Commit:** `perf(nav): switch dock tabs without resetting the stack`

#### A2. Swipe tab berjalan di JS thread

Lokasi: `src/app/AppNavigator.tsx:131-212` (`DockTabsScreen`, `PanResponder` + `Animated`).

Penyebab: gesture dan posisi halaman dihitung di JS (`onPanResponderMove` → `setValue`), jadi patah-patah setiap JS sibuk, dan rebutan gesture dengan `ScrollView` di dalam halaman.

Perbaikan:
- `npx expo install react-native-pager-view`.
- Ganti `View`/`Animated.View`/`PanResponder` dengan `<PagerView ref initialPage={activeIndex} onPageSelected={…}>`; satu child per tab, `key` = nama tab.
- `onPageSelected(e)` → `navigation.setParams({ tab: DOCK_ORDER[e.nativeEvent.position] })` (hanya bila berbeda), supaya `BottomDock` ikut sinkron lewat listener state yang sudah ada.
- `useEffect([activeIndex])` → `pagerRef.current?.setPage(activeIndex)` bila posisi pager berbeda (untuk tap dock dari A1).
- Hapus import `Animated`, `PanResponder`, `useWindowDimensions` yang tidak terpakai.

Selesai bila: swipe antar-tab mulus 60 fps di build release walaupun JS sedang sibuk (uji dengan Firestore update berjalan), dan scroll vertikal di dalam tab tidak "tertangkap" gesture horizontal.

**Commit:** `perf(nav): render dock pages in a native pager`

#### A3. Keempat layar tab di-mount sejak awal

Penyebab: `DOCK_ORDER.map(...)` me-render keempat halaman saat login, jadi waktu masuk lebih lama dan setiap update context me-render keempatnya.

Perbaikan:
- State `visited: Set<DockTabKey>` (awal: tab aktif). Tambahkan tab ke set saat `activeIndex` berubah.
- Halaman yang belum pernah dikunjungi dirender sebagai `<View style={{ flex: 1, backgroundColor: colors.surface }} />`. Setelah dikunjungi, tetap ter-mount (posisi scroll tidak hilang).
- Prefetch ringan: setelah tab aktif selesai tampil, tandai tab tetangga sebagai visited pada `requestIdleCallback`/`setTimeout(…, 0)` supaya swipe ke kanan tidak memperlihatkan halaman kosong. Opsional, ukur dulu.

**Commit:** `perf(nav): mount dock pages lazily on first visit`

#### A4. Prop navigasi palsu dibuat ulang setiap render

Lokasi: `src/app/AppNavigator.tsx:177-196` (`page()` dengan `fakeRoute` baru setiap render).

Perbaikan:
- Pindahkan objek `fakeRoute` per tab menjadi konstanta modul (`const DOCK_ROUTES = { Home: { key: 'Home', name: 'Home' }, … }`).
- Ekstrak `page()` menjadi komponen `DockPage = memo(function DockPage({ tab, role, navigation }) …)` supaya `setParams` di DockTabs tidak me-render ulang keempat halaman.

**Commit:** `perf(nav): keep dock page props referentially stable`

#### A5. Layar di bawah stack ikut re-render

Penyebab: saat membuka `StudentSessionDetail`, layar DockTabs di belakangnya tetap ikut re-render setiap context berubah.

Perbaikan:
- Tambahkan `freezeOnBlur: true` ke `screenOptions` `Stack.Navigator` utama (opsi tersedia di `@react-navigation/native-stack` 7.21, ditenagai `react-native-screens`). Layar yang tidak fokus dibekukan dan baru di-render ulang saat kembali fokus.
- Hoist `screenOptions` dan `headerRight` keluar dari render `AppNavigator` (konstanta modul + komponen `ProfileHeaderButton` yang memanggil `useNavigation` sendiri), supaya navigator tidak menerima opsi baru setiap `setActiveKey`.

Uji khusus: data yang berubah selama layar beku harus tampil benar setelah kembali (contoh: buka detail sesi, presensi dari HP lain, kembali ke Home → angka hadir terbaru).

**Commit 1:** `perf(nav): freeze stack screens while they are hidden`
**Commit 2:** `refactor(nav): hoist stack screen options out of render`

#### A6. Retry di Home praktikan mengganti route

Lokasi: `src/features/student/StudentHome.tsx:121` — `onRetry={() => navigation.replace('Home')}`.

Penyebab: di dalam DockTabs, `navigation` adalah navigasi stack induk, jadi `replace('Home')` mengganti seluruh `DockTabs` dengan layar `Home` terpisah: semua tab hilang dan di-mount ulang.

Perbaikan: pakai `retry` dari `useStudentAttendanceViewModel()` seperti di `AssistantHome`.

**Commit:** `fix(home): retry loading through the view model instead of replacing the route`

---

### Fase B — React Compiler (memoisasi otomatis)

#### B1. Aktifkan React Compiler

SDK 58 sudah mengonfigurasi Babel untuk React Compiler (`babel-plugin-react-compiler` sudah ada di `node_modules`), dan aturan lint-nya sudah ada di `eslint-config-expo` 58. Yang belum ada hanya flag-nya.

Langkah:
1. `npx react-compiler-healthcheck@latest` → catat komponen yang gagal dikompilasi.
2. Tambahkan ke `app.json`:
   ```json
   "experiments": { "reactCompiler": true }
   ```
3. `npx expo start --clear`, lalu `npm run lint` dan perbaiki pelanggaran *rules of React* yang dilaporkan (contoh yang perlu dicek: mutasi `drag.x` di `DockTabsScreen` sudah hilang di A2; `useRef` yang dibaca saat render).
4. Komponen yang belum bisa dipatuhkan diberi `'use no memo'` sementara, dengan komentar alasan.

Selesai bila: Profiler menunjukkan komponen bertanda "Memo ✨", dan tidak ada perubahan perilaku pada alur login, presensi, izin, dan peta.

**Commit 1:** `fix(lint): satisfy react compiler rules` (hanya bila ada pelanggaran)
**Commit 2:** `build: enable react compiler`

---

### Fase C — State & Firestore (re-render berantai)

Fase C tetap dikerjakan walau React Compiler sudah aktif: provider adalah titik paling kritis (semua layar bergantung padanya), jadi stabilitas value-nya dibuat eksplisit dan tidak bergantung pada compiler yang bisa *bail out*.

#### C1. Value `StudentAttendanceContext` dibuat ulang setiap render

Lokasi: `src/state/StudentAttendanceContext.tsx:214`.

Perbaikan:
- `getSessionById`, `getAttendanceForSession`, `retry` → `useCallback`.
- `checkIn` → `useCallback`; guard `submittingSessionId` dibaca dari `useRef` (bukan state), supaya fungsi tidak berubah setiap submit.
- `viewModel` → `useMemo` dengan dependensi state + callback.
- Pre-index: `useMemo(() => new Map(sessions.map(s => [s.id, s])))` dan map attendance per `sessionId`, supaya lookup O(1) dan tidak `.find()` berulang di setiap render list.

**Commit:** `perf(state): memoize the student attendance view model`

#### C2. Value `AssistantSessionsContext` dibuat ulang setiap render

Lokasi: `src/state/AssistantSessionsContext.tsx:349`.

Perbaikan: sama seperti C1 — semua aksi `useCallback`, `viewModel` `useMemo`, index `Map` untuk sesi dan kelas. Fungsi yang hanya meneruskan ke service (`openSession`, `createClass`, dst.) dibungkus satu kali dengan `useMemo` bergantung pada `enabled` dan `user?.uid`.

**Commit:** `perf(state): memoize the assistant sessions view model`

#### C3. Satu listener attendance per sesi (asisten)

Lokasi: `src/state/AssistantSessionsContext.tsx:304-336`.

Penyebab: asisten dengan 20 sesi membuka 20 `onSnapshot`; setiap update men-dispatch `SET_ATTENDANCE` dan me-render ulang seluruh aplikasi.

Perbaikan:
- Tambah `subscribeAttendanceForSessions(sessionIds, onData, onError)` di `assistantService.ts`: pecah ID per 30 (batas operator `in` Firestore), satu `onSnapshot` per chunk dengan `where('sessionId', 'in', chunk)`; urutkan `checkedInAt` di klien supaya tidak butuh indeks komposit baru.
- Hasil dikelompokkan per `sessionId` dan di-dispatch sekali sebagai `SET_ATTENDANCE_BULK`.
- Hanya chunk yang anggotanya berubah yang di-resubscribe.
- `subscribeAttendanceForSession` (satu sesi) tetap dipertahankan untuk roster.
- Cek `firestore.rules`: query `in` harus tetap lolos aturan baca attendance untuk asisten. Uji dengan akun asisten seed sebelum merge.

Selesai bila: jumlah listener attendance = ⌈jumlah sesi / 30⌉; roster dan "Semua presensi" tetap real-time.

**Commit:** `perf(assistant): batch attendance listeners by session chunks`

#### C4. Listener izin dibuat ulang per layar dan menduplikasi query sesi

Lokasi: `src/features/leave/useLeaveRequests.ts`, `src/services/firestore/leaveService.ts:117-170`, `src/features/leave/LeaveProvider.tsx:25`.

Penyebab:
- `useAssistantLeaveViewModel` dipakai di `AssistantHome` **dan** `AssistantLeaveReviewListScreen`; masing-masing membuka 1 listener sesi + N listener izin (satu per sesi).
- Listener sesi itu menduplikasi query yang sudah ada di `AssistantSessionsContext`.
- `LeaveProvider` membuat objek value baru setiap render (`value={{ user, service }}`).

Perbaikan (tiga commit):
1. `LeaveProvider` value → `useMemo`.
2. Pindahkan langganan `useLeaveRequests` ke dalam `LeaveProvider` (satu langganan per akun); hook view model hanya membaca context.
3. `subscribeAssistant` menerima daftar `sessionIds` dari luar (dari `AssistantSessionsContext`) dan memakai chunk `where('sessionId', 'in', …)` seperti C3, sehingga listener sesi duplikat hilang. Urutan provider di `AppNavigator` sudah benar (`AssistantSessionsProvider` membungkus `LeaveProvider`).

**Commit 1:** `perf(leave): memoize the leave provider value`
**Commit 2:** `perf(leave): share one leave subscription across screens`
**Commit 3:** `perf(leave): reuse assistant session ids and batch leave listeners`

#### C5. Sort sesi yang berulang

Lokasi: `StudentHome.tsx:128`, `AssistantHome.tsx:108`, `useCalendarViewModel.ts`.

Penyebab: query Firestore sesi sudah `orderBy('startsAt', 'asc')`, tetapi setiap render menyalin dan mengurutkan ulang dengan `new Date()` di comparator.

Perbaikan: hapus `[...sessions].sort(...)` yang redundan; untuk filter yang tersisa, hitung `Date.parse` sekali. Bungkus perhitungan turunan (hero, upcoming, todaySessions) dalam `useMemo` di hook view model kecil (`useStudentHomeViewModel`) bila compiler belum menanganinya.

**Commit:** `perf(home): drop redundant session sorting on every render`

#### C6. Formatter tanggal membuat `Intl` baru setiap panggilan

Lokasi: `src/app/formatters.ts`, `src/features/student/formatters.ts`, `src/features/assistant/formatters.ts`, `AssistantHome.tsx:101-106`, `WeekStrip.tsx`, `leave/components.tsx`, `StudentLeaveSessionPicker.tsx`, `LabMarkerDetailSheet.tsx`, `StudentCheckInScreen.tsx`, `StudentLeaveRequestFormScreen.tsx`.

Penyebab: `toLocaleDateString`/`new Intl.DateTimeFormat` di Hermes membuat formatter baru setiap panggilan, dan ini dipanggil per baris list setiap render.

Perbaikan:
- Buat `src/shared/format/dateFormatters.ts` berisi instance `Intl.DateTimeFormat('id-ID', …)` tingkat modul (satu per pola: jam, tanggal pendek, tanggal panjang, hari).
- Formatter yang ada memakai instance tersebut (`formatter.format(date)`); keluaran teks harus identik (tambahkan unit test kecil untuk 3–4 pola utama).

**Commit 1:** `perf(format): reuse cached Intl date formatters`
**Commit 2:** `test(format): cover cached date formatter output`

#### C7. Listener lab terduplikasi (prioritas rendah)

`useLabManagement` berlangganan `subscribeLabs` di setiap layar yang memakainya (daftar lab, form lab, form sesi), dan `labActivityService` berlangganan lagi untuk peta. Firestore SDK menggabungkan query identik di jaringan, tetapi parsing dan state tetap dikerjakan berulang di JS. Kerjakan hanya bila Profiler menunjukkan dampak nyata: angkat ke satu `LabsProvider`.

**Commit (opsional):** `perf(labs): share one labs subscription through a provider`

---

### Fase D — Tombol responsif

#### D1. Umpan balik tekan native

Penyebab: `Button`, `IconButton`, `ListRow`, `Card`, `BottomDock` memakai `style={({ pressed }) => …}`. State `pressed` harus lewat JS dulu, jadi tertunda saat JS sibuk. Tab dock tidak punya umpan balik sama sekali.

Perbaikan:
- Tambah `android_ripple={{ color: …, borderless: false }}` di semua `Pressable` milik design system (ripple digambar native di frame yang sama). Warna diambil dari token (`colors.lavenderSubtle` untuk permukaan terang, versi transparan untuk varian gelap).
- Tab dock: `android_ripple={{ borderless: true, radius: 28 }}` + `hitSlop`.
- iOS tetap memakai perubahan warna yang sudah ada.

**Commit:** `feat(ui): add native ripple feedback to pressables`

#### D2. Animasi skala saat ditekan

Perbaikan:
- `npx expo install react-native-reanimated react-native-worklets` (plugin Babel otomatis dikonfigurasi oleh `babel-preset-expo`).
- Komponen baru `src/shared/ui/PressableScale.tsx`: `Animated.createAnimatedComponent(Pressable)`, `onPressIn` → `scale.value = withTiming(0.97, { duration: 80 })`, `onPressOut` → `withSpring(1, { damping: 18, stiffness: 400 })`. Animasi berjalan di UI thread sejak dimulai.
- `useReducedMotion()` → tanpa skala bila pengguna mematikan animasi.
- Pakai di `Button`, `Card` interaktif, dan FAB `BottomDock`. `ListRow` cukup ripple/warna (skala di list panjang terasa berlebihan).

Catatan jujur: `onPressIn` tetap dipicu lewat JS. Fase A–C yang membebaskan JS thread adalah yang membuat ini terasa instan; Reanimated memastikan animasinya tidak patah setelah dimulai.

**Commit:** `feat(ui): animate press scale on buttons and cards`

#### D3. Haptic pada aksi utama

- `npx expo install expo-haptics`.
- `Haptics.selectionAsync()` saat tab dock berganti; `Haptics.impactAsync(Light)` pada FAB scan dan tombol "Presensi sekarang"/"Buka sesi".
- Jangan pasang di semua tombol.

**Commit:** `feat(ui): add haptic feedback to dock and primary actions`

#### D4. Aksi async: umpan balik dulu, kerja belakangan

Audit tombol yang memanggil Firestore (`AssistantHome` buka/tutup sesi, form kelas/sesi/lab, ajukan izin, review izin, presensi). Pastikan setiap tombol langsung menampilkan `loading` (atau dinonaktifkan) di render pertama setelah tap, sebelum `await`. Hasil audit awal: sebagian besar sudah memakai `busy`/`submitting`; perbaiki hanya yang belum.

**Commit:** `fix(ui): show pending state immediately on async actions` (hanya bila ada yang perlu diperbaiki)

---

### Fase E — Transisi layar & layar berat

#### E1. Peta di-mount saat animasi masuk berjalan

Lokasi: `src/features/maps/LabMapsScreen.tsx:111`.

Perbaikan: render placeholder (warna permukaan + `LoadingState`) dulu, lalu `MapView` setelah event `transitionEnd` dari navigator (`navigation.addListener('transitionEnd', …)`), dengan fallback timeout ±400 ms bila event tidak datang.

**Commit:** `perf(maps): mount the map after the push transition ends`

#### E2. GPS watcher terlalu agresif dan tetap jalan saat layar tidak fokus

Lokasi: `src/features/maps/useLabMapsViewModel.ts:120` (`Accuracy.High`, `timeInterval: 3000`, `distanceInterval: 5`).

Perbaikan:
- Hentikan watcher saat layar kehilangan fokus (`useIsFocused` / `useFocusEffect`) dan mulai lagi saat fokus kembali.
- Turunkan ke `Accuracy.Balanced`, `timeInterval: 5000`, `distanceInterval: 10`. Presensi tetap memakai fix akurasi tinggi sendiri di `deviceLocationService` (tidak terpengaruh).
- Abaikan update yang posisinya tidak berubah melewati ambang (hindari `setUserLocation` → re-render peta tanpa perubahan).

**Commit 1:** `perf(maps): pause location watching while the screen is unfocused`
**Commit 2:** `perf(maps): use balanced accuracy for the map location watcher`

#### E3. Kamera di-mount saat animasi masuk berjalan

Lokasi: `src/features/checkin/BarcodeScanScreen.tsx:67`.

Perbaikan: sama dengan E1 — `CameraView` dirender setelah `transitionEnd`; `onBarcodeScanned` di-set `undefined` setelah scan pertama supaya tidak memproses frame berikutnya saat `replace` ke `StudentCheckIn` berjalan (cek perilaku saat ini dulu).

**Commit:** `perf(checkin): start the camera after the push transition ends`

#### E4. Tuning animasi stack (opsional, dicoba dulu)

Opsi `animation` dan `animationDuration` tersedia di native-stack 7.21. Coba `animation: 'slide_from_right'` (Android) dan bandingkan rasanya dengan default; `animationDuration` hanya berlaku di sebagian platform/animasi, jadi cek dokumentasi `@react-navigation/native-stack` sebelum memakainya. Jangan commit kalau tidak ada perbedaan yang terasa.

**Commit (opsional):** `style(nav): use a slide transition for stack screens`

---

### Fase F — List & render

#### F1. List tanpa virtualisasi

Lokasi:
- `AssistantAllAttendanceScreen.tsx:59`
- `AssistantAllSessionsScreen.tsx:53`
- `StudentAllAttendanceScreen.tsx:91`
- `StudentAllSessionsScreen.tsx:103`
- `StudentAttendanceHistoryScreen.tsx:93`
- `AssistantAttendanceRosterScreen.tsx:78`

Penyebab: semua baris dirender sekaligus lewat `.map()` di dalam `ScrollView` milik `Screen`. Tidak ada satu pun `FlatList` di project.

Perbaikan:
- Tambah varian `Screen` untuk list: `scroll={false}` + slot `header`, atau komponen `ScreenList` di `shared/ui` yang membungkus `FlatList` dengan padding, safe area, dan `paddingBottom` dock yang sama dengan `Screen`.
- `keyExtractor`, `renderItem` stabil, `initialNumToRender={10}`, `windowSize={7}`, `removeClippedSubviews` di Android.
- Satu commit per pasangan layar yang mirip, supaya mudah direview.

**Commit 1:** `feat(ui): add a virtualized screen list container`
**Commit 2:** `perf(attendance): virtualize attendance lists`
**Commit 3:** `perf(sessions): virtualize session lists`
**Commit 4:** `perf(assistant): virtualize the attendance roster`

#### F2. Bayangan pada card di list (opsional, butuh persetujuan desain)

`Card` memakai `shadow.card` + `overflow: 'hidden'`. Di iOS, `overflow: 'hidden'` memotong bayangan sehingga biayanya terbuang; di Android `elevation` di setiap baris list menambah beban komposisi. Usulan: varian `panelFlat` (border saja) untuk card di dalam list. Diskusikan dengan pemilik `design.md` dulu.

**Commit (opsional):** `perf(ui): use flat cards inside long lists`

---

### Fase G — Startup & kebersihan

#### G1. Konfigurasi Firebase duplikat yang tidak dipakai

`src/config/firebase.ts` memanggil `initializeApp` kedua kalinya. Saat ini tidak di-import di mana pun (`src`, `scripts`, `functions`), tetapi berbahaya bila suatu saat di-import. Hapus.

**Commit:** `chore(firebase): remove the unused duplicate firebase config`

#### G2. Font di-embed saat build (opsional)

`App.tsx` menahan splash sampai 8 file font dimuat lewat `useFonts`. Plugin `expo-font` bisa meng-embed font saat build sehingga teks bisa langsung dirender (direkomendasikan dokumentasi SDK 58). Catatan:
- Tidak berlaku di Expo Go (`npm start` memakai `--go`), jadi `useFonts` tetap dipertahankan sebagai fallback.
- Di iOS, nama family diambil dari metadata file font, bukan nama file. Harus dicek dengan `getLoadedFonts()` supaya cocok dengan `fontFamily` di `tokens.ts`.

Kerjakan hanya bila baseline menunjukkan waktu startup yang signifikan.

**Commit (opsional):** `perf(startup): embed brand fonts at build time`

#### G3. Tidak perlu diubah

- `SessionQrCode` menggambar QR dengan `View` per *run* (sudah run-length encoded dan di-`useMemo`). Hanya ada di layar QR asisten; tidak perlu `react-native-svg`.
- `AuthContext` sudah memakai `useMemo`/`useCallback` dengan benar.
- Font sudah di-import per weight (tidak membundel semua weight).

## 3. Ringkasan urutan commit

| # | Fase | Commit | Wajib/opsional |
|---|------|--------|----------------|
| 1 | A1 | `perf(nav): switch dock tabs without resetting the stack` | wajib |
| 2 | A2 | `perf(nav): render dock pages in a native pager` | wajib |
| 3 | A3 | `perf(nav): mount dock pages lazily on first visit` | wajib |
| 4 | A4 | `perf(nav): keep dock page props referentially stable` | wajib |
| 5 | A5 | `perf(nav): freeze stack screens while they are hidden` | wajib |
| 6 | A5 | `refactor(nav): hoist stack screen options out of render` | wajib |
| 7 | A6 | `fix(home): retry loading through the view model instead of replacing the route` | wajib |
| 8 | B1 | `fix(lint): satisfy react compiler rules` | bila perlu |
| 9 | B1 | `build: enable react compiler` | wajib |
| 10 | C1 | `perf(state): memoize the student attendance view model` | wajib |
| 11 | C2 | `perf(state): memoize the assistant sessions view model` | wajib |
| 12 | C3 | `perf(assistant): batch attendance listeners by session chunks` | wajib |
| 13 | C4 | `perf(leave): memoize the leave provider value` | wajib |
| 14 | C4 | `perf(leave): share one leave subscription across screens` | wajib |
| 15 | C4 | `perf(leave): reuse assistant session ids and batch leave listeners` | wajib |
| 16 | C5 | `perf(home): drop redundant session sorting on every render` | wajib |
| 17 | C6 | `perf(format): reuse cached Intl date formatters` | wajib |
| 18 | C6 | `test(format): cover cached date formatter output` | wajib |
| 19 | C7 | `perf(labs): share one labs subscription through a provider` | opsional |
| 20 | D1 | `feat(ui): add native ripple feedback to pressables` | wajib |
| 21 | D2 | `feat(ui): animate press scale on buttons and cards` | wajib |
| 22 | D3 | `feat(ui): add haptic feedback to dock and primary actions` | opsional |
| 23 | D4 | `fix(ui): show pending state immediately on async actions` | bila perlu |
| 24 | E1 | `perf(maps): mount the map after the push transition ends` | wajib |
| 25 | E2 | `perf(maps): pause location watching while the screen is unfocused` | wajib |
| 26 | E2 | `perf(maps): use balanced accuracy for the map location watcher` | wajib |
| 27 | E3 | `perf(checkin): start the camera after the push transition ends` | wajib |
| 28 | E4 | `style(nav): use a slide transition for stack screens` | opsional |
| 29 | F1 | `feat(ui): add a virtualized screen list container` | wajib |
| 30 | F1 | `perf(attendance): virtualize attendance lists` | wajib |
| 31 | F1 | `perf(sessions): virtualize session lists` | wajib |
| 32 | F1 | `perf(assistant): virtualize the attendance roster` | wajib |
| 33 | F2 | `perf(ui): use flat cards inside long lists` | opsional |
| 34 | G1 | `chore(firebase): remove the unused duplicate firebase config` | wajib |
| 35 | G2 | `perf(startup): embed brand fonts at build time` | opsional |

Saran PR: satu PR per fase (A, B, C, D, E+F, G) supaya review kecil dan mudah di-revert.

## 4. Contoh commit (tanpa atribusi AI)

```powershell
git add src/app/AppNavigator.tsx
git commit -m "perf(nav): switch dock tabs without resetting the stack" -m "Resetting the root stack generated a new DockTabs route key on every tap, which remounted all four tab pages. Update the tab param in place, or popTo DockTabs from a detail screen."
```

Pastikan tidak ada baris `Co-Authored-By:` di pesan commit, dan cek sebelum push:

```powershell
git log --format=%B origin/main..HEAD | Select-String -Pattern "Co-Authored-By|Claude|Generated with"
```

Perintah di atas harus tidak mengeluarkan apa pun.

## 5. Uji regresi per fase

- **A:** tap setiap tab dock dari Home dan dari layar detail; swipe kiri/kanan di semua tab; back Android dari detail dan dari tab non-Home; buka notifikasi push → `StudentSessionDetail`/`StudentLeaveList` lalu tap dock.
- **B:** login email, login Google, pilih peran, logout → login akun lain (state lama tidak terbawa).
- **C:** presensi dari HP lain → Home asisten, roster, dan "Semua presensi" ter-update; ajukan izin → review asisten ter-update di Home dan daftar review; asisten dengan > 30 sesi (seed tambahan) tetap memuat semua attendance.
- **D:** semua varian `Button` (primary, accent, soft, outline, destructive, disabled, loading) dan `IconButton`; mode *reduce motion* aktif.
- **E:** buka/tutup peta berulang, pindah ke layar lain saat peta terbuka (watcher berhenti, cek log); scan QR → `StudentCheckIn`.
- **F:** list kosong, list 1 item, list 200 item (seed), pull ke bawah sampai akhir tanpa layar putih.

## 6. Tabel hasil pengukuran

| Metrik | Baseline | Setelah A | Setelah B+C | Setelah D–F |
|--------|----------|-----------|-------------|-------------|
| Tap tab → konten tampil (ms) | | | | |
| Komponen re-render per tap tab | | | | |
| FPS UI saat swipe tab | | | | |
| FPS JS saat buka detail sesi | | | | |
| Re-render Home per 1 update attendance | | | | |
| Listener Firestore aktif (asisten, 20 sesi) | | | | |
| Cold start → Home tampil (ms) | | | | |
