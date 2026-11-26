# Audit Skenario — Aslab (`lab_assistant`)

## Ringkasan Role

- Aslab mewarisi semua kemampuan Asprak (`isAssistantRole` true).
- Hak tambahan: kelola master laboratorium (`canManageLabMaster` true).
- Dampak navigasi: item "Lokasi Laboratorium" muncul di Profile; layar `AssistantLabList`/`AssistantLabForm` dapat digunakan.

## Perbedaan Hak Akses

| Kemampuan | Praktikan | Asprak | Aslab | Bukti |
|---|---:|---:|---:|---|
| Dock asisten & provider sesi asisten | - | Ya | Ya | `src/app/AppNavigator.tsx`, `src/domain/asprakScope.ts` |
| Kelola kelas/sesi/rekap/review izin | - | Ya | Ya | `src/app/ProfileScreen.tsx`, route asisten |
| Kelola master lab | - | Tidak | Ya | `src/domain/asprakScope.ts`, `src/app/ProfileScreen.tsx` |
| Dipilih saat Register/RoleSelection | Ya | Ya | Tidak terlihat | `src/features/auth/RegisterScreen.tsx`, `src/features/auth/RoleSelectionScreen.tsx` |

## Skenario 1 — Onboarding/Provisioning Aslab

| Step | Aksi user | Sistem | Temuan | Rekomendasi | Bukti |
|---|---|---|---|---|---|
| 1 | Daftar akun baru | Pilihan role hanya student/assistant | Aslab tidak bisa self-register sebagai aslab | Keputusan produk: jika by design, dokumentasikan provisioning admin; jika tidak, tambah flow aman | `src/features/auth/RegisterScreen.tsx` |
| 2 | Login Google pertama kali | RoleSelection hanya student/assistant | Sama seperti register | Sama | `src/features/auth/RoleSelectionScreen.tsx` |
| 3 | Mendapat role `lab_assistant` dari backend/admin | AuthContext membaca role dari Firestore | Role teknis didukung | Keep; buat SOP provisioning | `src/state/AuthContext.tsx`, `src/domain/types.ts` |

**P1 keputusan produk:** tentukan apakah Aslab dipromosikan oleh admin. Jika ya, UI auth tidak perlu opsi Aslab, tapi butuh copy "Peran Aslab diberikan admin".

## Skenario 2 — Semua Skenario Asprak

Aslab menjalankan skenario yang sama dengan [Asprak](./asprak.md), termasuk:
- Dashboard asisten
- Kelola kelas
- Kelola sesi & QR presensi
- Rekap presensi
- Review izin
- Peta, notifikasi, profil

**Audit tambahan:** pastikan tidak ada teks UI yang mengunci Aslab ke perilaku "Asprak" secara salah, kecuali memang identik.

## Skenario 3 — Kelola Master Laboratorium

| Step | Aksi user | Sistem | Temuan | Rekomendasi | Bukti |
|---|---|---|---|---|---|
| 1 | Buka Profil | Menu "Lokasi Laboratorium" muncul hanya untuk Aslab | Benar secara akses | Keep | `src/app/ProfileScreen.tsx` |
| 2 | Buka daftar lab | `AssistantLabListScreen` | Perlu cek empty state, edit/delete, validasi koordinat/radius | Audit dengan `page-audit.md` | `src/features/labs/AssistantLabListScreen.tsx` |
| 3 | Tambah/edit lab | `AssistantLabFormScreen` | Form kritikal karena mempengaruhi geofence presensi | Refine: validasi ketat lat/lng/radius, preview peta kecil opsional | `src/features/labs/AssistantLabFormScreen.tsx` |
| 4 | Pakai lab saat buat sesi | Session form memuat lab options | Baik; mengurangi salah ketik lokasi | Keep | `src/features/assistant/AssistantSessionFormScreen.tsx` |

**Potong/sederhanakan:**
- Jangan izinkan jalur ke LabForm dari role non-aslab. Saat ini guard menu ada di Profile, tapi route stack tetap terdaftar global; perlu guard di layar/aksi navigasi lain.
- Jika lab punya sesi aktif/riwayat, hapus lab harus dicegah atau dibuat soft-archive.

## Skenario 4 — Guardrail Akses

| Risiko | Kondisi | Rekomendasi | Bukti |
|---|---|---|---|
| Route leakage | `AssistantLabList/Form` ada di RootStack untuk semua user authenticated | Tambah guard role di screen + redirect/banner "Tidak berhak" | `src/app/AppNavigator.tsx` |
| Aksi tersembunyi tapi bisa dinavigasi | Menu disembunyikan hanya di Profile | Audit semua `navigate('AssistantLabForm'/'AssistantLabList')` | `src/features/assistant/AssistantSessionFormScreen.tsx` |
| Label role campur | "Asisten praktikum" vs "Asprak"/"Aslab" | Normalisasi label: tampilkan "Aslab" untuk `lab_assistant` di semua tempat | `src/features/auth/*`, `src/app/ProfileScreen.tsx`, `src/app/ProfileEditScreen.tsx` |

## Backlog Usulan (Aslab)

| ID | Usulan | Jenis | Prioritas |
|---|---|---|---|
| ASL-01 | Tentukan dan dokumentasikan provisioning role Aslab | Product/Ops | P1 |
| ASL-02 | Tambah guard role pada layar master lab | Guard | P1 |
| ASL-03 | Sembunyikan/disable CTA buat lab di session form untuk non-aslab | Cut/Guard | P1 |
| ASL-04 | Validasi koordinat/radius lab dan cegah hapus lab yang dipakai sesi | Refine | P1 |
| ASL-05 | Normalisasi label role Asprak/Aslab/Asisten praktikum | Refine | P2 |