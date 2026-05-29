import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  emptySubtext: { fontSize: 13, color: '#8b8fa8', textAlign: 'center' },
  errorText: { fontSize: 12, color: '#ef4444' },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row' },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#2d2d44', backgroundColor: '#1a1a2e',
  },
  filterChipActive: { backgroundColor: '#6366f122', borderColor: '#6366f166' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#8b8fa8' },
  filterChipTextActive: { color: '#6366f1' },
  cardGrid: { padding: 16, gap: 12, paddingBottom: 100 },
  card: {
    backgroundColor: '#1a1a2e', borderRadius: 14, borderWidth: 1,
    borderColor: '#2d2d44', overflow: 'hidden', flexDirection: 'row',
  },
  cardTypeBar: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 6 },
  typeTag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeTagText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  cardContent: { fontSize: 13, color: '#8b8fa8', lineHeight: 18 },
  cardMeta: { fontSize: 12, color: '#4a4a6a' },
  fab: { position: 'absolute', bottom: 80, right: 20 },
  fabButton: {
    backgroundColor: '#6366f1', borderRadius: 24,
    paddingVertical: 12, paddingHorizontal: 20,
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
