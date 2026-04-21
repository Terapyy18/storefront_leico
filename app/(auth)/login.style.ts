import { StyleSheet } from 'react-native';

export const COLORS = {
  background: '#F5F5F0',
  card:       '#FFFFFF',
  primary:    '#111111',
  accent:     '#4F46E5',
  muted:      '#9CA3AF',
  error:      '#EF4444',
  errorBg:    '#FEF2F2',
  errorBorder:'#FCA5A5',
  border:     '#E5E7EB',
  inputBg:    '#FAFAFA',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
};

export const styles = StyleSheet.create({

  // ─── Layout principal ───────────────────────────────────────────
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',   // ← centre horizontalement
    padding: SPACING.lg,
  },

   card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    width: '100%',          // ← prend toute la largeur disponible
    maxWidth: 400,          // ← mais jamais plus de 400px (parfait sur web)
  },

  // ─── En-tête ────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },

  // ─── Erreur ─────────────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorIcon: {
    fontSize: 14,
    color: COLORS.error,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
    lineHeight: 18,
  },

  // ─── Champs de saisie ───────────────────────────────────────────
  fieldWrap: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.inputBg,
  },
  inputRowFocused: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.card,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
    color: COLORS.muted,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: COLORS.primary,
  },

  // ─── Bouton principal ────────────────────────────────────────────
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // ─── Lien inscription ────────────────────────────────────────────
  signupRow: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  signupLink: {
    color: COLORS.accent,
    fontWeight: '500',
  },
});