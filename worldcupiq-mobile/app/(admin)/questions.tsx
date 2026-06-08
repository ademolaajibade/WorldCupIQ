import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../src/api/queries/admin';
import { AdminQuestion } from '../../src/types';
import { Badge } from '../../src/components/ui/Badge';
import { extractError } from '../../src/api/client';
import { COLORS, FONTS, RADIUS } from '../../constants/colors';

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

const EMPTY_Q: Omit<AdminQuestion, '_id' | 'isActive'> = {
  text: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  category: '',
  difficulty: 'medium',
  points: 10,
};

function QuestionRow({
  q,
  onEdit,
  onDelete,
}: {
  q: AdminQuestion;
  onEdit: (q: AdminQuestion) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Badge
          label={q.difficulty}
          variant={q.difficulty === 'easy' ? 'primary' : q.difficulty === 'medium' ? 'accent' : 'danger'}
        />
        <Badge label={q.category} variant="muted" />
        <Text style={styles.rowPoints}>{q.points} pts</Text>
      </View>
      <Text style={styles.rowText} numberOfLines={2}>{q.text}</Text>
      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(q)}>
          <Ionicons name="pencil-outline" size={14} color={COLORS.primary} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(q._id)}>
          <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminQuestionsScreen() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<AdminQuestion | null>(null);
  const [form, setForm] = useState<Omit<AdminQuestion, '_id' | 'isActive'>>(EMPTY_Q);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-questions', page, search],
    queryFn: () => adminApi.getQuestions(page, search),
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createQuestion,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-questions'] }); setModalVisible(false); },
    onError: (err) => Alert.alert('Error', extractError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminQuestion> }) => adminApi.updateQuestion(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-questions'] }); setModalVisible(false); },
    onError: (err) => Alert.alert('Error', extractError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteQuestion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-questions'] }),
    onError: (err) => Alert.alert('Error', extractError(err)),
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY_Q); setModalVisible(true); };
  const openEdit = (q: AdminQuestion) => {
    setEditing(q);
    setForm({ text: q.text, options: [...q.options], correctAnswer: q.correctAnswer, category: q.category, difficulty: q.difficulty, points: q.points });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const handleSave = () => {
    if (!form.text.trim() || !form.correctAnswer.trim() || !form.category.trim()) {
      Alert.alert('Validation', 'Fill in all required fields.');
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing._id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const questions = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Questions</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={18} color={COLORS.white} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search questions..."
          placeholderTextColor={COLORS.textFaint}
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
          selectionColor={COLORS.primary}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={styles.loading} />
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(q) => q._id}
          renderItem={({ item }) => (
            <QuestionRow q={item} onEdit={openEdit} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.list}
          refreshing={false}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>No questions found</Text>}
          ListFooterComponent={
            <View style={styles.pagination}>
              <TouchableOpacity style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]} onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <Ionicons name="chevron-back" size={16} color={page === 1 ? COLORS.textFaint : COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.pageText}>{page} / {totalPages}</Text>
              <TouchableOpacity style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]} onPress={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <Ionicons name="chevron-forward" size={16} color={page >= totalPages ? COLORS.textFaint : COLORS.text} />
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Question' : 'New Question'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Question Text *</Text>
            <TextInput
              style={[styles.fieldInput, styles.multiline]}
              value={form.text}
              onChangeText={(t) => setForm({ ...form, text: t })}
              multiline
              numberOfLines={3}
              placeholder="Enter question..."
              placeholderTextColor={COLORS.textFaint}
              selectionColor={COLORS.primary}
            />

            <Text style={styles.fieldLabel}>Category *</Text>
            <TextInput style={styles.fieldInput} value={form.category} onChangeText={(t) => setForm({ ...form, category: t })} placeholder="e.g. History, Teams" placeholderTextColor={COLORS.textFaint} selectionColor={COLORS.primary} />

            <Text style={styles.fieldLabel}>Options (4 required)</Text>
            {form.options.map((opt, i) => (
              <TextInput
                key={i}
                style={[styles.fieldInput, { marginBottom: 8 }]}
                value={opt}
                onChangeText={(t) => {
                  const opts = [...form.options];
                  opts[i] = t;
                  setForm({ ...form, options: opts });
                }}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                placeholderTextColor={COLORS.textFaint}
                selectionColor={COLORS.primary}
              />
            ))}

            <Text style={styles.fieldLabel}>Correct Answer *</Text>
            <TextInput style={styles.fieldInput} value={form.correctAnswer} onChangeText={(t) => setForm({ ...form, correctAnswer: t })} placeholder="Exact text of correct option" placeholderTextColor={COLORS.textFaint} selectionColor={COLORS.primary} />

            <Text style={styles.fieldLabel}>Difficulty</Text>
            <View style={styles.diffRow}>
              {DIFFICULTIES.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.diffBtn, form.difficulty === d && styles.diffBtnActive]}
                  onPress={() => setForm({ ...form, difficulty: d })}
                >
                  <Text style={[styles.diffBtnText, form.difficulty === d && styles.diffBtnTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Points</Text>
            <TextInput
              style={styles.fieldInput}
              value={String(form.points)}
              onChangeText={(t) => setForm({ ...form, points: parseInt(t) || 0 })}
              keyboardType="numeric"
              selectionColor={COLORS.primary}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isPending} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>{isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create Question'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  heading: { color: COLORS.text, fontSize: FONTS['2xl'], fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.md },
  addBtnText: { color: COLORS.white, fontSize: FONTS.sm, fontWeight: '700' },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: FONTS.base, paddingVertical: 10 },

  loading: { marginTop: 40 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },

  row: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 10 },
  rowHeader: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' },
  rowPoints: { color: COLORS.accent, fontSize: FONTS.xs, fontWeight: '700', marginLeft: 'auto' },
  rowText: { color: COLORS.text, fontSize: FONTS.sm, lineHeight: 20, marginBottom: 10 },
  rowActions: { flexDirection: 'row', gap: 8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${COLORS.primary}15`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm },
  editBtnText: { color: COLORS.primary, fontSize: FONTS.xs, fontWeight: '700' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${COLORS.danger}15`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm },
  deleteBtnText: { color: COLORS.danger, fontSize: FONTS.xs, fontWeight: '700' },

  empty: { color: COLORS.textMuted, textAlign: 'center', padding: 40 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 12 },
  pageBtn: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  pageBtnDisabled: { opacity: 0.4 },
  pageText: { color: COLORS.text, fontSize: FONTS.sm },

  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { color: COLORS.text, fontSize: FONTS.lg, fontWeight: '800' },
  modalBody: { padding: 16 },

  fieldLabel: { color: COLORS.textMuted, fontSize: FONTS.xs, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  fieldInput: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, fontSize: FONTS.base, paddingHorizontal: 12, paddingVertical: 10 },
  multiline: { height: 80, textAlignVertical: 'top' },

  diffRow: { flexDirection: 'row', gap: 8 },
  diffBtn: { flex: 1, paddingVertical: 9, borderRadius: RADIUS.md, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  diffBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  diffBtnText: { color: COLORS.textMuted, fontSize: FONTS.sm, fontWeight: '600' },
  diffBtnTextActive: { color: COLORS.white },

  saveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  saveBtnText: { color: COLORS.white, fontSize: FONTS.base, fontWeight: '700' },
});
