import { StyleSheet } from 'react-native';

export const COLORS = {
  background: '#FAF7F2',
  card: '#FFFFFF',
  primary: '#1C1C1A',
  accent: '#C4714A', // terracotta
  sage: '#2D4A3E', // vert sauge
  muted: '#A89880',
  border: '#E8DDD0',
  inputBg: '#FDFBF8',
  error: '#C0533A',
  errorBg: '#FEF3EE',
  errorBorder: '#F0C4B0',
  successBg: '#EAF3EE',
  successBorder: '#A8D5BE',
  success: '#2D4A3E',
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
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#8B6F5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },

  // ─── En-tête ────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoText: {
    color: COLORS.background,
    fontSize: 24,
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
    borderRadius: 12,
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
    borderRadius: 14,
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
    height: 50,
    fontSize: 15,
    color: COLORS.primary,
  },

  // ─── Bouton principal ────────────────────────────────────────────
  btn: {
    backgroundColor: COLORS.accent,
    borderRadius: 99,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // ─── Lien connexion ──────────────────────────────────────────────
  loginRow: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  loginLink: {
    color: COLORS.sage,
    fontWeight: '600',
  },

  // ─── Écran confirmation email ────────────────────────────────────
  confirmRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  confirmCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: SPACING.md,
    shadowColor: '#8B6F5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  confirmIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIconText: {
    fontSize: 30,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmEmail: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  confirmBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 99,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: SPACING.sm,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
