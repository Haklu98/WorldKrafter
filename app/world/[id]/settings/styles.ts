import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 24, gap: 24 },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b8fa8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dangerCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#3d1f1f',
    gap: 10,
  },
  dangerLabel: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  dangerDesc: { fontSize: 13, color: '#8b8fa8', lineHeight: 18 },
  deleteButton: {
    backgroundColor: '#7f1d1d',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  deleteButtonText: { color: '#fca5a5', fontSize: 14, fontWeight: '700' },
  errorText: { fontSize: 12, color: '#ef4444' },
  disabled: { opacity: 0.6 },
});
