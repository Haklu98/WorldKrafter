import { StyleSheet } from 'react-native';

// Shared field styles used across modals
export const F = StyleSheet.create({
  field: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#c0c4d8' },
  hint: { fontSize: 11, color: '#8b8fa8' },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
  },
  textArea: { minHeight: 60, textAlignVertical: 'top' as const },
  inputError: { borderColor: '#ef4444' },
});

// Shared modal / page styles
export const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, gap: 28, paddingBottom: 48 },

  emptySection: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  emptySubtext: { fontSize: 14, color: '#8b8fa8', textAlign: 'center', maxWidth: 320, lineHeight: 20 },
  emptyActions: { gap: 10, width: '100%', maxWidth: 320, marginTop: 8 },
  emptyCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#2d2d44', alignItems: 'center' },
  emptyCardText: { fontSize: 14, color: '#4a4a6a' },

  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: 0.8 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#2d2d44' },
  addBtnText: { fontSize: 12, color: '#8b8fa8', fontWeight: '600' },

  primaryBtn: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { borderWidth: 1, borderColor: '#2d2d44', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { color: '#8b8fa8', fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.6 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#16162a', borderRadius: 20, padding: 24, width: '100%', maxWidth: 540, gap: 16, borderWidth: 1, borderColor: '#2d2d44' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  modalBody: { gap: 14 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#2d2d44', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText: { color: '#8b8fa8', fontSize: 15, fontWeight: '600' },

  badge: { backgroundColor: '#6366f122', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#6366f144' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#6366f1' },

  radioOption: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2d2d44', gap: 12 },
  radioOptionActive: { borderColor: '#6366f1', backgroundColor: '#1e1e35' },
  radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366f1' },
  radioLabel: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  radioSublabel: { fontSize: 12, color: '#8b8fa8', marginTop: 3, lineHeight: 17 },

  stepRow: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 4 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2d2d44' },
  stepDotActive: { backgroundColor: '#6366f1' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2d2d44', gap: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  toggleHint: { fontSize: 12, color: '#8b8fa8', marginTop: 2 },

  divider: { height: 1, backgroundColor: '#1e1e30' },
  errorText: { fontSize: 12, color: '#ef4444' },
  twoCol: { flexDirection: 'row', gap: 10 },

  periodBlock: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2d2d44', gap: 10 },
  periodTitle: { fontSize: 13, fontWeight: '700', color: '#6366f1' },

  infoBox: { backgroundColor: '#1e1e35', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#6366f133' },
  infoText: { fontSize: 13, color: '#8b8fa8', lineHeight: 18 },
  infoHighlight: { color: '#fdba74', fontWeight: '700' },

  previewRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, gap: 6 },
  previewLabel: { fontSize: 12, color: '#8b8fa8' },
  previewValue: { fontSize: 13, color: '#ffffff', fontWeight: '600', flex: 1 },
});
