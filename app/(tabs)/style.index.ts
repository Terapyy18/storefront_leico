import { StyleSheet } from 'react-native';

export const COLORS = {
  background:  '#FAF7F2',
  card:        '#FFFFFF',
  primary:     '#1C1C1A',
  accent:      '#C4714A',  // terracotta
  sage:        '#2D4A3E',  // vert sauge
  sageBg:      '#EAF3EE',
  muted:       '#A89880',
  border:      '#E8DDD0',
  error:       '#C0533A',
  errorBg:     '#FEF3EE',
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
    paddingBottom: SPACING.xl,
  },

  // ─── Loading / Error ────────────────────────────────────────────
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },

  // ─── Header ─────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.muted,
  },

  // ─── Hero carousel ───────────────────────────────────────────────
  heroSlide: {
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    backgroundColor: '#F0EAE0',
  },
  heroImagePlaceholder: {
    width: '100%',
    backgroundColor: '#F0EAE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImagePlaceholderText: {
    fontSize: 48,
    color: COLORS.muted,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: 'rgba(28,28,26,0.45)',
  },
  heroCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 99,
    marginBottom: SPACING.xs,
  },
  heroCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  heroPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(250,247,242,0.85)',
    marginTop: 2,
  },
  heroBtn: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.accent,
    borderRadius: 99,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },
  heroBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ─── Flèches carousel ────────────────────────────────────────────
  arrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(250,247,242,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(232,221,208,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  arrowText: {
    fontSize: 28,
    color: '#1C1C1A',
    lineHeight: 32,
  },

  // ─── Dots pagination ─────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: COLORS.accent,
  },

  // ─── Section label ───────────────────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ─── Meilleures ventes ───────────────────────────────────────────
  bestSellerCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#8B6F5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  bestSellerImage: {
    width: 120,
    height: 150,
    backgroundColor: COLORS.border,
  },
  bestSellerImagePlaceholder: {
    width: 120,
    height: 150,
    backgroundColor: '#F0EAE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestSellerImagePlaceholderText: {
    fontSize: 32,
  },
  bestSellerBody: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  bestSellerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 99,
    marginBottom: SPACING.xs,
  },
  bestSellerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.sage,
  },
  bestSellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  bestSellerDescription: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
    flex: 1,
  },
  bestSellerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  bestSellerPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.accent,
  },
  bestSellerBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: 99,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
  },
  bestSellerBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ─── Empty ───────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
  },
});