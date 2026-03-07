import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { useStore } from '../../store/useStore';

type TxType = 'expense' | 'income' | 'transfer';

export default function NewTransaction() {
  const router = useRouter();
  const { accounts, categories, fetchAccounts, fetchCategories, createTransaction } = useStore();
  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [toAccountId, setToAccountId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [date] = useState(dayjs().format('YYYY-MM-DD'));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAccounts().then(() => {
      if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id);
    });
    fetchCategories();
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id);
  }, [accounts]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return Alert.alert('提示', '请输入有效金额');
    if (!accountId) return Alert.alert('提示', '请选择账户');
    if (type === 'transfer' && !toAccountId) return Alert.alert('提示', '请选择转入账户');

    setSaving(true);
    try {
      await createTransaction({
        type, amount: parseFloat(amount),
        category_id: categoryId ?? undefined,
        account_id: accountId,
        to_account_id: toAccountId ?? undefined,
        note, date,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('错误', e.message);
    } finally {
      setSaving(false);
    }
  };

  const typeColors: Record<TxType, string> = { expense: '#ef4444', income: '#22c55e', transfer: '#3b82f6' };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* 类型切换 */}
      <View style={styles.typeRow}>
        {(['expense', 'income', 'transfer'] as TxType[]).map((t) => (
          <TouchableOpacity key={t} onPress={() => { setType(t); setCategoryId(null); }}
            style={[styles.typeBtn, type === t && { backgroundColor: typeColors[t] }]}>
            <Text style={[styles.typeBtnText, type === t && { color: '#fff' }]}>
              {{ expense: '支出', income: '收入', transfer: '转账' }[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 金额 */}
      <View style={styles.amountBox}>
        <Text style={styles.amountCurrency}>¥</Text>
        <TextInput
          style={[styles.amountInput, { color: typeColors[type] }]}
          placeholder="0.00"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          autoFocus
        />
      </View>

      {/* 账户选择 */}
      <Text style={styles.sectionLabel}>{type === 'transfer' ? '转出账户' : '账户'}</Text>
      <View style={styles.optionsRow}>
        {accounts.map((a) => (
          <TouchableOpacity key={a.id} onPress={() => setAccountId(a.id)}
            style={[styles.optionChip, accountId === a.id && styles.optionChipActive]}>
            <Text style={[styles.optionChipText, accountId === a.id && styles.optionChipTextActive]}>
              {a.icon} {a.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 转入账户 */}
      {type === 'transfer' && (
        <>
          <Text style={styles.sectionLabel}>转入账户</Text>
          <View style={styles.optionsRow}>
            {accounts.filter((a) => a.id !== accountId).map((a) => (
              <TouchableOpacity key={a.id} onPress={() => setToAccountId(a.id)}
                style={[styles.optionChip, toAccountId === a.id && styles.optionChipActive]}>
                <Text style={[styles.optionChipText, toAccountId === a.id && styles.optionChipTextActive]}>
                  {a.icon} {a.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* 分类 */}
      {type !== 'transfer' && (
        <>
          <Text style={styles.sectionLabel}>分类</Text>
          <View style={styles.categoryGrid}>
            {filteredCategories.map((c) => (
              <TouchableOpacity key={c.id} onPress={() => setCategoryId(c.id)}
                style={[styles.categoryItem, categoryId === c.id && styles.categoryItemActive]}>
                <Text style={styles.categoryIcon}>{c.icon}</Text>
                <Text style={[styles.categoryName, categoryId === c.id && { color: '#22c55e' }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* 备注 */}
      <Text style={styles.sectionLabel}>备注</Text>
      <TextInput style={styles.noteInput} placeholder="可选备注..." value={note} onChangeText={setNote} />

      {/* 提交 */}
      <TouchableOpacity onPress={handleSubmit} disabled={saving}
        style={[styles.submitBtn, { backgroundColor: typeColors[type], opacity: saving ? 0.7 : 1 }]}>
        <Text style={styles.submitBtnText}>{saving ? '保存中...' : '保存'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center' },
  typeBtnText: { fontWeight: '600', fontSize: 14, color: '#6b7280' },
  amountBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  amountCurrency: { fontSize: 28, color: '#9ca3af', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: 'bold' },
  sectionLabel: { fontSize: 13, color: '#9ca3af', marginBottom: 8, marginTop: 4 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  optionChipActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  optionChipText: { fontSize: 13, color: '#6b7280' },
  optionChipTextActive: { color: '#fff', fontWeight: '600' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  categoryItem: { width: 72, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f3f4f6' },
  categoryItemActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  categoryIcon: { fontSize: 26, marginBottom: 2 },
  categoryName: { fontSize: 11, color: '#6b7280', textAlign: 'center' },
  noteInput: { backgroundColor: '#fff', borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  submitBtn: { borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 40 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
