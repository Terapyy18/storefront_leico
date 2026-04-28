import { StyleSheet } from 'react-native';

export const COLORS = {
  background: '#FAF7F2',
  card: '#FFFFFF',
  primary: '#1C1C1A',
  accent: '#C4714A', // terracotta
  sage: '#2D4A3E', // vert sauge
  sageBg: '#EAF3EE', // sauge très clair
  sageBorder: '#A8D5BE',
  muted: '#A89880',
  border: '#E8DDD0',
  inputBg: '#FDFBF8',
  danger: '#C0533A',
  dangerBg: '#FEF3EE',
  dangerBorder: '#F0C4B0',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
};

export const styles = StyleSheet.create({
  // ─── Layout ─────────────────────────────────────────────────────
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    padding: SPACING.md,
    gap: SPACING.md,
  },

  // ─── Loading ────────────────────────────────────────────────────
  loadingRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── En-tête profil ─────────────────────────────────────────────
  profileCard: {
    backgroundColor: COLORS.sage, // fond sauge foncé = élément signature
    borderRadius: 24,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    shadowColor: '#2D4A3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accent, // terracotta sur sauge = combo signature
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background, // sable sur fond sauge
  },
  profileSince: {
    fontSize: 13,
    color: 'rgba(250,247,242,0.65)',
  },

  // ─── Section générique ───────────────────────────────────────────
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#8B6F5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },

  // ─── Historique commandes ────────────────────────────────────────
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderLeft: {
    gap: SPACING.xs,
  },
  orderRef: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.muted,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  orderBadge: {
    fontSize: 11,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: COLORS.sageBg,
    color: COLORS.sage,
    fontWeight: '500',
  },
  orderEmpty: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },

  // ─── Champs modifiables ──────────────────────────────────────────
  fieldWrap: {
    gap: SPACING.sm,
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

  // ─── Bouton principal (terracotta) ───────────────────────────────
  btnPrimary: {
    backgroundColor: COLORS.accent,
    borderRadius: 99,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryPressed: {
    opacity: 0.85,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // ─── Bouton danger (déconnexion) ─────────────────────────────────
  btnDanger: {
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: 99,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDangerPressed: {
    opacity: 0.85,
  },
  btnDangerText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '600',
  },

  // ─── Page non connecté ───────────────────────────────────────────
  guestRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  guestCard: {
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
  guestIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.sageBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  },
  guestIconText: {
    fontSize: 30,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  guestBtnRow: {
    width: '100%',
    gap: SPACING.sm,
  },
});
