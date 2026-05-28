import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import Marked from 'react-native-marked';
import { CARD_TYPES, CARD_TYPE_COLOR, type CardType } from '../../../lib/cardTypes';

type Props = {
  visible: boolean;
  // Controlled field values passed in from the parent
  title: string;
  type: CardType;
  content: string;
  titleError: string;
  createError: string;
  creating: boolean;
  onChangeTitle: (v: string) => void;
  onChangeType: (v: CardType) => void;
  onChangeContent: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

type ToolbarAction = {
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
};

const TOOLBAR: ToolbarAction[] = [
  { label: 'B',   prefix: '**', suffix: '**' },
  { label: 'I',   prefix: '_',  suffix: '_' },
  { label: 'H1',  prefix: '# ', suffix: '', block: true },
  { label: 'H2',  prefix: '## ', suffix: '', block: true },
  { label: 'H3',  prefix: '### ', suffix: '', block: true },
  { label: '—',   prefix: '\n---\n', suffix: '', block: true },
  { label: '• ',  prefix: '- ', suffix: '', block: true },
  { label: '1.',  prefix: '1. ', suffix: '', block: true },
  { label: '> ',  prefix: '> ', suffix: '', block: true },
];

function insertMarkdown(
  text: string,
  action: ToolbarAction,
  onChange: (v: string) => void
) {
  // Simple append — a full cursor-aware insert requires a native ref trick
  // that doesn't work cross-platform in RN web. Append to end instead.
  const trimmed = text.endsWith('\n') ? text : text + '\n';
  if (action.block) {
    onChange(trimmed + action.prefix);
  } else {
    onChange(text + action.prefix + 'text' + action.suffix);
  }
}

export default function CardEditorDesktop({
  visible,
  title,
  type,
  content,
  titleError,
  createError,
  creating,
  onChangeTitle,
  onChangeType,
  onChangeContent,
  onClose,
  onSubmit,
}: Props) {
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const typeColor = CARD_TYPE_COLOR[type];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={() => {}}>

          {/* ── Top bar ── */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.topBarRight}>
              {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
              <TouchableOpacity
                style={[styles.saveBtn, creating && styles.disabled]}
                onPress={onSubmit}
                disabled={creating}
              >
                {creating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>Save card</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Wiki header row ── */}
          <View style={styles.wikiHeader}>
            {/* Left: title + type */}
            <View style={styles.wikiMeta}>
              <TextInput
                style={[styles.titleInput, titleError ? styles.titleInputError : null]}
                placeholder="Card name…"
                placeholderTextColor="#4a4a6a"
                value={title}
                onChangeText={onChangeTitle}
              />
              {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}

              {/* Type picker inline */}
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBadge, { backgroundColor: typeColor + '22', borderColor: typeColor + '55' }]}
                  onPress={() => setTypePickerOpen((v) => !v)}
                >
                  <Text style={[styles.typeBadgeText, { color: typeColor }]}>{type}</Text>
                  <Text style={[styles.chevron, { color: typeColor }]}>
                    {typePickerOpen ? ' ▲' : ' ▼'}
                  </Text>
                </TouchableOpacity>
              </View>

              {typePickerOpen && (
                <View style={styles.typeDropdown}>
                  <FlatList
                    data={CARD_TYPES}
                    keyExtractor={(t) => t}
                    style={{ maxHeight: 220 }}
                    scrollEnabled
                    renderItem={({ item }) => {
                      const active = item === type;
                      const c = CARD_TYPE_COLOR[item];
                      return (
                        <TouchableOpacity
                          style={[styles.typeDropdownItem, active && styles.typeDropdownItemActive]}
                          onPress={() => { onChangeType(item); setTypePickerOpen(false); }}
                        >
                          <View style={[styles.typeTagSmall, { backgroundColor: c + '22' }]}>
                            <Text style={[styles.typeTagSmallText, { color: c }]}>{item}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              )}
            </View>

            {/* Right: placeholder image */}
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>🖼</Text>
              <Text style={styles.imagePlaceholderLabel}>Image</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── Editor area ── */}
          <View style={styles.editorArea}>
            {/* Toolbar + tab switcher */}
            <View style={styles.editorToolbar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolbarScroll}>
                {TOOLBAR.map((action) => (
                  <TouchableOpacity
                    key={action.label}
                    style={styles.toolbarBtn}
                    onPress={() => insertMarkdown(content, action, onChangeContent)}
                  >
                    <Text style={styles.toolbarBtnText}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.tabSwitcher}>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'write' && styles.tabBtnActive]}
                  onPress={() => setTab('write')}
                >
                  <Text style={[styles.tabBtnText, tab === 'write' && styles.tabBtnTextActive]}>
                    Write
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'preview' && styles.tabBtnActive]}
                  onPress={() => setTab('preview')}
                >
                  <Text style={[styles.tabBtnText, tab === 'preview' && styles.tabBtnTextActive]}>
                    Preview
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Editor / Preview pane */}
            {tab === 'write' ? (
              <TextInput
                style={styles.markdownInput}
                multiline
                value={content}
                onChangeText={onChangeContent}
                placeholder={'Write in markdown…\n\n# Heading\n**bold**, _italic_\n- list item'}
                placeholderTextColor="#4a4a6a"
                textAlignVertical="top"
              />
            ) : (
              <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent}>
                {content.trim() ? (
                  <Marked
                    value={content}
                    flatListProps={{ scrollEnabled: false }}
                    theme={{
                      text: { color: '#c0c4d8', fontSize: 15, lineHeight: 24 },
                      heading1: { color: '#ffffff', fontSize: 26, fontWeight: '800', marginBottom: 8 },
                      heading2: { color: '#ffffff', fontSize: 21, fontWeight: '700', marginBottom: 6 },
                      heading3: { color: '#e2e4f0', fontSize: 17, fontWeight: '700', marginBottom: 4 },
                      strong: { color: '#ffffff', fontWeight: '700' },
                      em: { color: '#c0c4d8', fontStyle: 'italic' },
                      blockquote: { backgroundColor: '#1e1e35', borderLeftColor: '#6366f1', borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 4 },
                      code: { backgroundColor: '#1e1e35', color: '#a5b4fc', fontFamily: 'monospace', borderRadius: 4, paddingHorizontal: 4 },
                      hr: { backgroundColor: '#2d2d44', height: 1, marginVertical: 16 },
                    }}
                  />
                ) : (
                  <Text style={styles.previewEmpty}>Nothing to preview yet.</Text>
                )}
              </ScrollView>
            )}
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  panel: {
    backgroundColor: '#13131f',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2d2d44',
    width: '100%',
    maxWidth: 900,
    maxHeight: '90%',
    overflow: 'hidden',
    flexDirection: 'column',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e30',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2d2d44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#8b8fa8', fontSize: 14 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  errorText: { fontSize: 12, color: '#ef4444' },
  disabled: { opacity: 0.6 },

  // Wiki header
  wikiHeader: {
    flexDirection: 'row',
    padding: 24,
    paddingBottom: 16,
    gap: 24,
    alignItems: 'flex-start',
  },
  wikiMeta: { flex: 1, gap: 10 },
  titleInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
    paddingBottom: 8,
    letterSpacing: -0.5,
  },
  titleInputError: { borderBottomColor: '#ef4444' },
  typeRow: { flexDirection: 'row', alignItems: 'center' },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  typeBadgeText: { fontSize: 13, fontWeight: '700' },
  chevron: { fontSize: 10 },
  typeDropdown: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
    zIndex: 20,
  },
  typeDropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  typeDropdownItemActive: { backgroundColor: '#23233a' },
  typeTagSmall: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  typeTagSmallText: { fontSize: 12, fontWeight: '700' },

  // Placeholder image
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
    borderStyle: 'dashed',
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  imagePlaceholderIcon: { fontSize: 28 },
  imagePlaceholderLabel: { fontSize: 11, color: '#4a4a6a', fontWeight: '500' },

  divider: { height: 1, backgroundColor: '#1e1e30', marginHorizontal: 24 },

  // Editor
  editorArea: { flex: 1, flexDirection: 'column', minHeight: 360 },
  editorToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e30',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  toolbarScroll: { flex: 1 },
  toolbarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2d2d44',
    marginRight: 4,
    backgroundColor: '#1a1a2e',
  },
  toolbarBtnText: { color: '#c0c4d8', fontSize: 12, fontWeight: '700' },
  tabSwitcher: { flexDirection: 'row', gap: 2 },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tabBtnActive: { backgroundColor: '#1e1e35' },
  tabBtnText: { fontSize: 12, color: '#8b8fa8', fontWeight: '600' },
  tabBtnTextActive: { color: '#ffffff' },
  markdownInput: {
    flex: 1,
    color: '#c0c4d8',
    fontSize: 15,
    lineHeight: 24,
    padding: 20,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
    minHeight: 300,
  },
  previewScroll: { flex: 1 },
  previewContent: { padding: 20, paddingBottom: 40 },
  previewEmpty: { color: '#4a4a6a', fontSize: 14, fontStyle: 'italic' },
});
