/**
 * Layar pilih peran dipakai di dua konteks:
 * - `onboarding`: akun sudah masuk (mis. Google pertama kali) tetapi belum
 *   punya profil peran. Navigator hanya berisi layar ini, jadi tidak ada
 *   layar untuk kembali atau mendaftar; jalan keluarnya adalah keluar akun.
 * - `signup`: dibuka dari alur autentikasi sebelum masuk.
 */
export type RoleSelectionContext = 'onboarding' | 'signup';

export type RoleSelectionChrome = {
  showBack: boolean;
  secondaryAction: 'switch_account' | 'register';
  intro: string;
};

export function roleSelectionContext(
  needsRoleSelection: boolean,
): RoleSelectionContext {
  return needsRoleSelection ? 'onboarding' : 'signup';
}

export function roleSelectionChrome(
  context: RoleSelectionContext,
): RoleSelectionChrome {
  if (context === 'onboarding') {
    return {
      showBack: false,
      secondaryAction: 'switch_account',
      intro:
        'Satu langkah lagi: pilih peranmu untuk menyelesaikan akun ini. Peran menentukan halaman yang kamu lihat.',
    };
  }
  return {
    showBack: true,
    secondaryAction: 'register',
    intro: 'Pilih peranmu sebelum melanjutkan.',
  };
}
