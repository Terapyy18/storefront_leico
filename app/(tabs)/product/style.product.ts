import { StyleSheet } from 'react-native';

export const COLORS = {
  background:   '#FAF7F2',
  card:         '#FFFFFF',
  primary:      '#1C1C1A',
  accent:       '#C4714A',  // terracotta
  sage:         '#2D4A3E',  // vert sauge
  sageBg:       '#EAF3EE',
  sageBorder:   '#A8D5BE',
  muted:        '#A89880',
  border:       '#E8DDD0',
  inputBg:      '#FDFBF8',
  error:        '#C0533A',
  errorBg:      '#FEF3EE',
  outOfStock:   '#E8DDD0',
  outOfStockText:'#A89880',
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

  // ─── Loading / Not found ─────────────────────────────────────────
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  backLink: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '500',
  },

  // ─── Layout principal (responsive) ──────────────────────────────
  // Utilisé dynamiquement dans le composant avec useWindowDimensions
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  column: {
    flexDirection: 'column',
    flex: 1,
  },

  // ─── Panneau image (gauche) ──────────────────────────────────────
  imagePane: {
    backgroundColor: '#F0EAE0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EAE0',
  },
  imagePlaceholderText: {
    fontSize: 64,
    color: COLORS.muted,
  },
  backBtn: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(250,247,242,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backBtnText: {
    fontSize: 18,
    color: COLORS.primary,
  },

  // ─── Panneau infos (droite) ──────────────────────────────────────
  infoPane: {
    backgroundColor: COLORS.background,
  },
  infoScroll: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
    shadowColor: '#8B6F5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  // ─── Infos produit ───────────────────────────────────────────────
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.sage,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 28,
  },
  productPrice: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.accent,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 22,
  },

  // ─── Variantes / tailles ─────────────────────────────────────────
  variantsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  variantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  variantChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    minWidth: 52,
  },
  variantChipOutOfStock: {
    backgroundColor: COLORS.outOfStock,
    borderColor: COLORS.outOfStock,
  },
  variantChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  variantChipTextOutOfStock: {
    color: COLORS.outOfStockText,
    textDecorationLine: 'line-through',
  },
  variantStock: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },
  variantColor: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 1,
  },

  // ─── Quantité ────────────────────────────────────────────────────
  quantityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityBtnText: {
    fontSize: 18,
    color: COLORS.primary,
    lineHeight: 22,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    minWidth: 28,
    textAlign: 'center',
  },

  // ─── Boutons d'action ────────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  btnCart: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 99,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCartPressed: {
    opacity: 0.85,
  },
  btnCartText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  btnFav: {
    width: 52,
    height: 52,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFavActive: {
    backgroundColor: '#FEF3EE',
    borderColor: '#F0C4B0',
  },
  btnFavText: {
    fontSize: 20,
  },
});