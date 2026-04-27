import { StyleSheet } from 'react-native';

// ─── Palette ──────────────────────────────────────────────────────────────────

export const COLORS = {
  // Fonds
  bg: '#F7F5F0', // ivoire chaud
  surface: '#FFFFFF',
  surfaceAlt: '#F0EDE8', // ivoire plus foncé pour les encarts
  card: '#FFFFFF',

  // Textes
  text: '#1A1714', // quasi-noir chaud
  textMid: '#6B6560', // gris chaud moyen
  textLight: '#A39E99', // gris chaud clair

  // Accent principal
  accent: '#3D4EAC', // indigo profond
  accentLight: '#EEF0FA', // indigo très pâle

  // Bordures
  border: '#E8E4DF',
  borderStrong: '#D0CBC4',

  // Statuts
  pending: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  confirmed: { bg: '#DBEAFE', text: '#1E3A8A', dot: '#3B82F6' },
  shipped: { bg: '#EDE9FE', text: '#4C1D95', dot: '#8B5CF6' },
  delivered: { bg: '#D1FAE5', text: '#064E3B', dot: '#10B981' },
  cancelled: { bg: '#FEE2E2', text: '#7F1D1D', dot: '#EF4444' },
};

export const STATUS_MAP: Record<string, { bg: string; text: string; dot: string; label: string }> =
  {
    pending: { ...COLORS.pending, label: 'En attente' },
    confirmed: { ...COLORS.confirmed, label: 'Confirmée' },
    shipped: { ...COLORS.shipped, label: 'Expédiée' },
    delivered: { ...COLORS.delivered, label: 'Livrée' },
    cancelled: { ...COLORS.cancelled, label: 'Annulée' },
  };

// ─── Styles ───────────────────────────────────────────────────────────────────

export const S = StyleSheet.create({
  // ── Layout ────────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },

  // ── Filtres statut ────────────────────────────────────────────────────────
  filtersBar: {
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 54,
    backgroundColor: COLORS.surface,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.accentLight,
    borderColor: COLORS.accent,
  },
  filterPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMid,
  },
  filterPillTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },

  // ── Count ─────────────────────────────────────────────────────────────────
  countBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Liste ─────────────────────────────────────────────────────────────────
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },

  // ── Carte commande ────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    // Ombre douce
    shadowColor: '#1A1714',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardAccentBar: {
    height: 3,
  },
  cardInner: {
    padding: 16,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardId: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 3,
  },
  cardAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  cardAmountLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    textAlign: 'right',
    marginTop: 1,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  cardAddress: {
    fontSize: 12,
    color: COLORS.textMid,
    flex: 1,
    marginRight: 12,
  },

  // ── Badge statut ──────────────────────────────────────────────────────────
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
  },

  // ════════════════════════════════════════════════════════
  // MODAL DÉTAIL COMMANDE
  // ════════════════════════════════════════════════════════

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,23,20,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '93%',
    // Ombre haute
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },

  // Pill handle
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderStrong,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  sheetHeaderArea: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sheetOrderId: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  sheetOrderDate: {
    fontSize: 13,
    color: COLORS.textMid,
    marginTop: 3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sheetBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  // ── Statuts selector ──────────────────────────────────────────────────────
  statusScrollContent: {
    gap: 8,
    marginBottom: 24,
  },
  statusSelectorBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  statusSelectorText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Adresse ───────────────────────────────────────────────────────────────
  addressBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMid,
    lineHeight: 20,
  },

  // ── Items ─────────────────────────────────────────────────────────────────
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnAddItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  btnAddItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },

  emptyItems: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },

  // Carte item
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    shadowColor: '#1A1714',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  itemDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemVariantRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  itemVariantChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemVariantChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMid,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemUnitPrice: {
    fontSize: 12,
    color: COLORS.textLight,
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperInput: {
    width: 40,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    height: 36,
  },
  itemSubtotal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  // ── Total ─────────────────────────────────────────────────────────────────
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.text,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 32,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },

  // ════════════════════════════════════════════════════════
  // MODAL AJOUT ITEM
  // ════════════════════════════════════════════════════════

  addSheetSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
    marginBottom: 16,
  },
  addSheetSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },

  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    shadowColor: '#1A1714',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  variantInfo: { flex: 1 },
  variantName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  variantChips: { flexDirection: 'row', gap: 5, marginTop: 5, flexWrap: 'wrap' },
  variantChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  variantChipText: { fontSize: 11, fontWeight: '600', color: COLORS.textMid },
  variantPrice: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  variantStock: { fontSize: 11, color: COLORS.textLight, marginTop: 1 },

  addBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '33',
  },
  alreadyBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alreadyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
});
