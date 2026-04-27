import { Platform, StyleSheet } from 'react-native';

export const COLORS = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#000000',
  accent: '#000000',
  muted: '#888888',
  border: '#EEEEEE',
  lightBg: '#F9F9F9',
  error: '#D32F2F',
  outOfStock: '#F5F5F5',
  outOfStockText: '#AAAAAA',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
};

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  backLink: {
    fontSize: 16,
    color: COLORS.muted,
  },

  // Image
  imageContainer: {
    width: '100%',
    height: 450,
    backgroundColor: COLORS.lightBg,
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
    backgroundColor: COLORS.lightBg,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },

  // Content
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: 120, // Space for footer
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  productName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    flex: 1,
    marginRight: SPACING.md,
    lineHeight: 32,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Description
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 15,
    color: '#444444',
    lineHeight: 24,
  },

  // Variants
  variantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  variantChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    minWidth: 64,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  variantChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  variantChipOutOfStock: {
    backgroundColor: COLORS.outOfStock,
    borderColor: COLORS.outOfStock,
    opacity: 0.6,
  },
  variantChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  variantChipTextSelected: {
    color: COLORS.card,
  },

  // Quantity
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  quantityBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  quantityBtnText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    minWidth: 32,
    textAlign: 'center',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: 34, // Safe area bottom
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    zIndex: 100,
    elevation: 10,
  },
  btnFav: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  btnCart: {
    flex: 1,
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  btnCartText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
