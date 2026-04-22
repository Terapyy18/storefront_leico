import { StyleSheet } from 'react-native';

export const COLORS = {
  background:   '#FAF7F2',
  card:         '#FFFFFF',
  primary:      '#1C1C1A',
  accent:       '#C4714A',
  sage:         '#2D4A3E',
  sageBg:       '#EAF3EE',
  muted:        '#A89880',
  border:       '#E8DDD0',
  danger:       '#C0533A',
  dangerBg:     '#FEF3EE',
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
  list: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },

  // ─── Header ─────────────────────────────────────────────────────
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },

  // ─── Loading / Centered ──────────────────────────────────────────
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },

  // ─── États vides / non connecté ──────────────────────────────────
  stateCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: SPACING.md,
    shadowColor: '#8B6F5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.sageBg,
    borderWidth: 1,
    borderColor: '#A8D5BE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateIconText: {
    fontSize: 28,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
  stateBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 99,
    height: 48,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  stateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // ─── Card favori ─────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#8B6F5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: 110,
    height: 130,
    backgroundColor: '#F0EAE0',
  },
  imagePlaceholder: {
    width: 110,
    height: 130,
    backgroundColor: '#F0EAE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 28,
    color: COLORS.muted,
  },
  info: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  infoTop: {
    gap: SPACING.xs,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 99,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.sage,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
  },
  infoBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.accent,
  },
  removeBtn: {
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: 99,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
  },
});