# Rancangan database Supabase

> Rancangan ini untuk integrasi setelah Sprint 1. Sprint 1 tidak membuat project Supabase, koneksi client, autentikasi, migrasi, atau operasi backend.

## Relasi inti

```text
auth.users 1──1 profiles
profiles 1──* group_memberships *──1 practical_groups
practical_courses 1──* sessions *──1 practical_groups
sessions 1──* attendance *──1 profiles (praktikan)
```

## Tabel

| Tabel               | Kolom inti                                                                                              | Catatan                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `profiles`          | `id`, `display_name`, `created_at`                                                                      | `id` mengikuti UUID `auth.users.id`; baris dibuat saat auth kelak diaktifkan.                                  |
| `practical_courses` | `id`, `name`, `code`, `created_at`                                                                      | Katalog mata praktikum. `code` unik.                                                                           |
| `practical_groups`  | `id`, `name`, `created_at`                                                                              | Kelas/kelompok praktikum, misalnya Kelas A.                                                                    |
| `group_memberships` | `group_id`, `profile_id`, `role`, `created_at`                                                          | Menghubungkan profil dengan kelompok; role `assistant` atau `student`. PK gabungan mencegah keanggotaan ganda. |
| `sessions`          | `id`, `course_id`, `group_id`, `starts_at`, `ends_at`, `status`, `opened_at`, `closed_at`, `created_at` | Satu jadwal pelaksanaan praktikum; status `scheduled`, `open`, atau `closed`.                                  |
| `attendance`        | `id`, `session_id`, `student_id`, `checked_in_at`                                                       | Satu catatan presensi per praktikan per sesi. Kendala unik menjamin tidak ada duplikasi.                       |

## SQL skema awal (untuk integrasi mendatang)

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.practical_courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table public.practical_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.group_memberships (
  group_id uuid not null references public.practical_groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('assistant', 'student')),
  created_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.practical_courses (id),
  group_id uuid not null references public.practical_groups (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'open', 'closed')),
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check ((status <> 'open') or opened_at is not null),
  check ((status <> 'closed') or closed_at is not null)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id),
  checked_in_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create index sessions_group_starts_at_idx
  on public.sessions (group_id, starts_at);
create index attendance_session_checked_in_at_idx
  on public.attendance (session_id, checked_in_at);
create index attendance_student_checked_in_at_idx
  on public.attendance (student_id, checked_in_at desc);
```

## Aturan dan keputusan

- Waktu disimpan sebagai `timestamptz`; UI menampilkan waktu lokal.
- Batas unik `(session_id, student_id)` adalah perlindungan database untuk presensi ganda saat backend kelak aktif. Di Sprint 1 aturan yang sama diterapkan pada state lokal.
- Validasi bahwa hanya anggota ber-role `student` yang dapat presensi dan hanya asisten kelompok yang dapat mengelola sesi memerlukan kebijakan Row Level Security (RLS) atau fungsi backend. Kebijakan tersebut belum dirancang/diaktifkan dalam Sprint 1.
- `group_memberships` memungkinkan seseorang memiliki role berbeda pada kelompok berbeda tanpa menjadikan role demo sebagai klaim autentikasi.
- Jika sesi dihapus, catatan presensinya ikut terhapus (`on delete cascade`). Data akademik produksi mungkin memerlukan kebijakan arsip/retensi yang berbeda.
- RLS harus diaktifkan dan diuji sebelum tabel berisi data nyata atau diakses klien.

## Pemetaan ke fixture Sprint 1

Fixture lokal sebaiknya memakai bentuk data yang mudah dipetakan ke `sessions` dan `attendance`, tetapi tidak wajib menggunakan UUID/database client. Pisahkan sumber demo asisten dan praktikan bila memudahkan skenario. Jangan menyimpulkan perubahan di satu role otomatis tercermin pada role lainnya.
