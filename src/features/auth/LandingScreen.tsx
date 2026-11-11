import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { AuthStackParamList } from '../../app/navigation';
import { isFirebaseConfigured } from '../../services/firebase';
import {
  Banner,
  Button,
  Card,
  CardContent,
  CardOverline,
  colors,
  radius,
  Screen,
  spacing,
  typography,
} from '../../shared/ui';
import { useAuth } from '../../state';

type Props = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

export function LandingScreen({ navigation }: Props) {
  const { loginWithGoogle, error, clearError } = useAuth();
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  const handleGoogleLogin = async () => {
    clearError();
    await loginWithGoogle();
  };

  return (
    <Screen>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top System Badge & Laboratory Identity */}
        <View style={styles.header}>
          <View style={styles.systemBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.systemText}>FTI • LAB INTEGRATED SYSTEM v1.2</Text>
          </View>
          <View style={styles.logoContainer}>
            <Ionicons name="logo-ionic" size={28} color={colors.onPrimary} />
          </View>
        </View>

        {/* Editorial Hero Visual Section */}
        <View style={styles.heroContainer}>
          <View style={styles.heroImageWrapper}>
            <View style={styles.heroImage} />
            <View style={styles.heroGradient} />
            <View style={styles.liveTag}>
              <View style={styles.liveTagIcon} />
              <Text style={styles.liveTagText}>Lab RPL • Gedung B201</Text>
            </View>
            <View style={styles.heroBottom}>
              <View style={styles.semesterChip}>
                <Text style={styles.semesterText}>SEMESTER GENAP</Text>
              </View>
              <View style={styles.statusChip}>
                <Text style={styles.statusText}>Aktif Terjadwal</Text>
              </View>
            </View>
          </View>

          {/* Tactile Interactive Simulation Card */}
          <View style={styles.simCard}>
            <View style={styles.simRow}>
              <View style={styles.iconBox}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.simLabel}>Sesi Shift Terdekat</Text>
                <Text style={styles.simTime}>08:00 – 10:30</Text>
              </View>
              <View style={styles.verifiedPill}>
                <View style={styles.checkIcon} />
                <Text style={styles.verifiedText}>Presensi Terverifikasi</Text>
              </View>
            </View>

            {/* Bench and Assistant Quick Pill Row */}
            <View style={styles.pillRow}>
              <View style={styles.pillLeft}>
                <View style={styles.desktopIcon} />
                <Text style={styles.pillText}>Bench #14 • Praktikum AI</Text>
              </View>
              <View style={styles.pillRight}>
                <View style={styles.avatar1} />
                <View style={styles.avatar2} />
              </View>
            </View>
          </View>
        </View>

        {/* Editorial Headline & Copywriting */}
        <View style={styles.copySection}>
          <View style={styles.kicker}>
            <Ionicons name="text-outline" size={18} color={colors.primary} />
            <Text style={styles.kickerText}>Laboratorium Modern</Text>
          </View>
          <Text style={styles.headline}>
            Satu ritme praktikum,{' '}
            <Text style={styles.headlineEmphasis}>di setiap sudut lab.</Text>
          </Text>
          <Text style={styles.subhead}>
            Platform terintegrasi untuk asisten laboratorium, dosen pembimbing,
            dan mahasiswa. Pantau jadwal shift, presensi realtime, dan tukar
            jadwal praktikum tanpa hambatan.
          </Text>

          {/* Lab Metric Micro Badges */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>14+</Text>
              <Text style={styles.metricLabel}>Laboratorium</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValueSecondary}>99.8%</Text>
              <Text style={styles.metricLabel}>Akurasi Presensi</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValueTertiary}>Instant</Text>
              <Text style={styles.metricLabel}>Tukar Jadwal</Text>
            </View>
          </View>
        </View>

        {/* Action Button Group */}
        <View style={styles.actionsSection}>
          {!isFirebaseConfigured ? (
            <Banner
              title="Konfigurasi Firebase belum diisi"
              message="Salin .env.example menjadi .env dan isi EXPO_PUBLIC_FIREBASE_* sebelum login."
              tone="warning"
            />
          ) : null}

          <Button
            label="Masuk dengan Email Kampus"
            variant="primary"
            icon="mail-outline"
            onPress={() => setShowEmailLogin(true)}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Masuk dengan Google"
            onPress={handleGoogleLogin}
            style={styles.googleButton}
          >
            <Ionicons name="logo-google" size={20} color={colors.inkMuted} />
            <Text style={styles.googleButtonText}>Masuk dengan Akun Google</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Belum memiliki akun?</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Registrasi Akun Baru"
              onPress={() => navigation.navigate('Register')}
              style={styles.registerLink}
            >
              <Text style={styles.registerLinkText}>Registrasi Akun Baru</Text>
            </Pressable>
          </View>
        </View>

        {/* SSO Academic Disclaimer Footer */}
        <View style={styles.footer}>
          <View style={styles.ssoBadge}>
            <View style={styles.shieldIcon} />
            <Text style={styles.ssoText}>Single Sign-On (SSO) Terpadu</Text>
          </View>
          <Text style={styles.footerText}>
            Terhubung langsung dengan SIAKAD & Sistem Presensi Terpadu Fakultas
            Teknologi Informasi.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.panel,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lime,
  },
  systemText: {
    ...typography.label,
    color: colors.inkMuted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContainer: {
    width: '100%',
    marginTop: spacing.sm,
  },
  heroImageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surface,
  },
  heroGradient: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'transparent',
  },
  liveTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  liveTagIcon: {
    width: 16,
    height: 16,
  },
  liveTagText: {
    ...typography.label,
    color: colors.ink,
    fontWeight: '600',
  },
  heroBottom: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  semesterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
  },
  semesterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onPrimary,
    fontFamily: 'monospace',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.lavender,
    borderRadius: 20,
  },
  statusText: {
    ...typography.label,
    color: colors.violet,
    fontWeight: 'bold',
  },
  simCard: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simLabel: {
    ...typography.label,
    color: colors.inkMuted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  simTime: {
    ...typography.subtitle,
    color: colors.ink,
    fontFamily: 'serif',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.lavender,
    borderRadius: 20,
  },
  checkIcon: {
    width: 14,
    height: 14,
  },
  verifiedText: {
    ...typography.label,
    color: colors.violet,
    fontWeight: 'bold',
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  pillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  desktopIcon: {
    width: 20,
    height: 20,
  },
  pillText: {
    ...typography.body,
    color: colors.inkMuted,
  },
  pillRight: {
    flexDirection: 'row',
    gap: -6,
  },
  avatar1: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatar2: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  copySection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  kickerText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headline: {
    ...typography.title,
    color: colors.ink,
    fontWeight: 'normal',
  },
  headlineEmphasis: {
    color: colors.primary,
    fontStyle: 'italic',
  },
  subhead: {
    ...typography.body,
    color: colors.inkMuted,
    lineHeight: 22,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  metricValue: {
    ...typography.title,
    color: colors.ink,
    fontFamily: 'serif',
  },
  metricValueSecondary: {
    ...typography.title,
    color: colors.lime,
    fontFamily: 'serif',
  },
  metricValueTertiary: {
    ...typography.title,
    color: colors.primary,
    fontFamily: 'serif',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  actionsSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  googleButton: {
    width: '100%',
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  googleButtonText: {
    marginLeft: spacing.xs,
    ...typography.body,
    color: colors.ink,
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.body,
    color: colors.inkMuted,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  registerText: {
    ...typography.body,
    color: colors.inkMuted,
  },
  registerLink: {
    // no extra styles needed
  },
  registerLinkText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  ssoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    opacity: 0.8,
  },
  shieldIcon: {
    width: 14,
    height: 14,
  },
  ssoText: {
    ...typography.label,
    color: colors.inkMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  footerText: {
    ...typography.label,
    color: colors.inkMuted,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 200,
  },
});
