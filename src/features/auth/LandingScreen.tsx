import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AuthStackParamList } from '../../app/navigation';
import { isFirebaseConfigured } from '../../services/firebase';
import { Banner } from '../../shared/ui/Banner';
import { Text } from '../../shared/ui/Text';
import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { useAuth } from '../../state';

type Props = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

export function LandingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { loginWithGoogle, error, clearError } = useAuth();

  const [googlePending, setGooglePending] = useState(false);

  // Show the pending state on the tap frame and block a second prompt.
  const handleGoogleLogin = async () => {
    if (googlePending) return;
    setGooglePending(true);
    clearError();
    try {
      await loginWithGoogle();
    } finally {
      setGooglePending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Ambient gradient / blur circles */}
      <View style={[styles.blob, styles.blobTopLeft]} pointerEvents="none" />
      <View
        style={[styles.blob, styles.blobCenterRight]}
        pointerEvents="none"
      />
      <View style={[styles.blob, styles.blobBottom]} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, spacing.lg),
            paddingBottom: Math.max(insets.bottom, spacing.lg),
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Central Brand & Editorial Identity */}
        <View style={styles.centralHero}>
          {/* Main Title: LabPresensi */}
          <View style={styles.titleRow}>
            <Text variant="display" tone="onDark" style={styles.titlePrimary}>
              Lab
            </Text>
            <Text variant="displayAccent" style={styles.titleItalic}>
              Presensi
            </Text>
          </View>

          {/* Subtitle */}
          <Text variant="body" style={styles.subtitle}>
            Satu ritme praktikum terpadu di setiap sudut laboratorium komputasi
            & riset.
          </Text>

          {/* Indikator sesi lab */}
          <View style={styles.shiftBadge}>
            <View style={styles.avatarGroup}>
              <View style={[styles.avatar, { backgroundColor: colors.lime }]}>
                <Text variant="overline" tone="ink">
                  FP
                </Text>
              </View>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.pink, marginLeft: -6 },
                ]}
              >
                <Text variant="overline" tone="ink">
                  AR
                </Text>
              </View>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.lavender, marginLeft: -6 },
                ]}
              >
                <Text variant="overline" tone="violet">
                  KT
                </Text>
              </View>
            </View>
            <Text variant="label" tone="onDark">
              18 Asisten Berjaga Hari Ini
            </Text>
          </View>
        </View>

        {/* 3 Core Feature Cards Array */}
        <View style={styles.featureGrid}>
          {/* Feature 1: Jadwal & Sesi */}
          <View style={styles.featureCard}>
            <View style={[styles.iconCircle, { backgroundColor: colors.lime }]}>
              <Ionicons name="calendar" size={18} color={colors.ink} />
            </View>
            <Text
              variant="captionStrong"
              tone="onDark"
              style={styles.featureTitle}
            >
              Jadwal & Sesi
            </Text>
            <Text variant="caption" style={styles.featureSub}>
              Roster jaga & tukar jadwal
            </Text>
          </View>

          {/* Feature 2: Kode Presensi */}
          <View style={[styles.featureCard, styles.featureCardHighlighted]}>
            <View
              style={[styles.iconCircle, { backgroundColor: colors.onPrimary }]}
            >
              <Ionicons name="scan-outline" size={18} color={colors.violet} />
            </View>
            <Text
              variant="captionStrong"
              tone="onDark"
              style={styles.featureTitle}
            >
              Kode Presensi
            </Text>
            <Text
              variant="captionStrong"
              style={[styles.featureSub, styles.featureSubStrong]}
            >
              Penanda lab yang akurat
            </Text>
          </View>

          {/* Feature 3: Modul & BAP */}
          <View style={styles.featureCard}>
            <View style={[styles.iconCircle, { backgroundColor: colors.pink }]}>
              <Ionicons
                name="checkmark-done"
                size={18}
                color={colors.pinkInk}
              />
            </View>
            <Text
              variant="captionStrong"
              tone="onDark"
              style={styles.featureTitle}
            >
              Modul & BAP
            </Text>
            <Text variant="caption" style={styles.featureSub}>
              Validasi berita acara dosen
            </Text>
          </View>
        </View>

        {/* Banners for Firebase / Auth Status if any */}
        {!isFirebaseConfigured ? (
          <View style={styles.bannerWrapper}>
            <Banner
              tone="warning"
              title="Konfigurasi Firebase belum diisi"
              message="Salin .env.example menjadi .env sebelum masuk."
            />
          </View>
        ) : null}

        {error ? (
          <View style={styles.bannerWrapper}>
            <Banner
              tone="danger"
              title="Gagal masuk"
              message={error}
              onDismiss={clearError}
            />
          </View>
        ) : null}

        {/* Bottom Actions & Verification Dock */}
        <View style={styles.bottomDock}>
          {/* Primary Action Button: Electric Lime */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Masuk ke Lab Praktikum"
            onPress={() => navigation.navigate('Login')}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <View style={styles.btnContent}>
              <Ionicons name="log-in-outline" size={20} color={colors.ink} />
              <Text variant="bodyStrong" tone="ink">
                Masuk ke Lab Praktikum
              </Text>
            </View>
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={16} color={colors.ink} />
            </View>
          </Pressable>

          {/* Secondary Action: Masuk dengan Google */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Masuk dengan Google"
            accessibilityState={{
              busy: googlePending,
              disabled: googlePending,
            }}
            disabled={googlePending}
            onPress={handleGoogleLogin}
            style={({ pressed }) => [
              styles.secondaryBtn,
              (pressed || googlePending) && styles.btnPressed,
            ]}
          >
            {googlePending ? (
              <ActivityIndicator size="small" color={colors.lavender} />
            ) : (
              <Ionicons name="logo-google" size={16} color={colors.lavender} />
            )}
            <Text variant="label" tone="violet">
              Masuk dengan Akun Google
            </Text>
          </Pressable>

          {/* Register Link */}
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Daftar akun baru"
            onPress={() => navigation.navigate('Register')}
            style={styles.registerRow}
          >
            <Text variant="caption" style={styles.registerPrompt}>
              Belum punya akun?
            </Text>
            <Text variant="captionStrong" style={styles.registerLink}>
              Daftar Baru
            </Text>
          </Pressable>

          {/* Footer verifikasi resmi */}
          <View style={styles.ssoFooter}>
            <Ionicons
              name="shield-checkmark-outline"
              size={12}
              color={colors.lavender}
            />
            <Text variant="caption" tone="onDarkMuted">
              Terhubung Resmi dengan SIAP UNDIP
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.violet, // Primary container background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    rowGap: 5,
  },
  // Ambient glow blobs
  blob: {
    position: 'absolute',
    borderRadius: radius.full,
    opacity: 0.18,
  },
  blobTopLeft: {
    top: -60,
    left: -50,
    width: 220,
    height: 220,
    backgroundColor: colors.lime,
  },
  blobCenterRight: {
    top: '35%',
    right: -70,
    width: 250,
    height: 250,
    backgroundColor: colors.pink,
  },
  blobBottom: {
    bottom: -50,
    left: '25%',
    width: 220,
    height: 220,
    backgroundColor: colors.lavender,
  },

  // Central hero identity
  centralHero: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginVertical: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
    paddingVertical: 4,
  },
  titlePrimary: {
    includeFontPadding: false,
  },
  titleItalic: {
    color: colors.lime,
    marginLeft: 2,
    includeFontPadding: false,
  },
  subtitle: {
    color: colors.lavender,
    textAlign: 'center',
    maxWidth: 260,
    marginTop: spacing.xs,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.onInkSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  avatarGroup: {
    flexDirection: 'row',
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.violet,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.onInkSubtle,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
  },
  featureCardHighlighted: {
    backgroundColor: colors.onInkRaised,
    position: 'relative',
  },
  cardCornerDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 5,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.lime,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  featureTitle: {
    textAlign: 'center',
  },
  featureSub: {
    color: colors.lavender,
    textAlign: 'center',
    marginTop: 2,
  },
  featureSubStrong: {
    color: colors.lime,
  },

  bannerWrapper: {
    marginVertical: spacing.xs,
  },

  // Bottom dock actions
  bottomDock: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryBtn: {
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    ...shadow.elevated,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.onLightSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.violet,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...shadow.subtle,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  registerPrompt: {
    color: colors.lavender,
  },
  registerLink: {
    color: colors.lime,
  },
  ssoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 4,
  },
});
