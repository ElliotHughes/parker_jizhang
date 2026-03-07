import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';
import { formatAmount } from '@jizhang/shared';
import type { Transaction } from '@jizhang/shared';

type TxType = 'all' | 'income' | 'expense' | 'transfer';

export default function Transactions() {
  const { transactions, fetchTransactions, deleteTransaction } = useStore();
  const [filterType, setFilterType] = useState<TxType>('all');
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const load = useCallback(async () => {
    const params: Record<string, string | number> = { limit: 30 };
    if (filterType !== 'all') params.type = filterType;
    const res = await fetchTransactions(params);
    setTotal(res.total);
  }, [filterType]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: number) => {
    Alert.alert('删除确认', '确定删除该记录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { await deleteTransaction(id); load(); } },
    ]);
  };

  const renderItem = ({ item: tx }: { item: Transaction }) => (
    <View style={styles.txRow}>
      <Text style={styles.txIcon}>{tx.category_icon || '📦'}</Text>
      <View style={styles.txInfo}>
        <Text style={styles.txName}>{tx.category_name || '转账'}</Text>
        <Text style={styles.txMeta}>{tx.date} · {tx.account_name}{tx.note ? ` · ${tx.note}` : ''}</Text>
      </View>
      <Text style={[styles.txAmount, {
        color: tx.type === 'income' ? '#22c55e' : tx.type === 'expense' ? '#ef4444' : '#3b82f6'
      }]}>
        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}¥{formatAmount(tx.amount)}
      </Text>
      <TouchableOpacity onPress={() => handleDelete(tx.id)} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>交易记录 ({total})</Text>
        <TouchableOpacity onPress={() => router.push('/transaction/new')} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ 记账</Text>
        </TouchableOpacity>
      </View>

      {/* 类型筛选 */}
      <View style={styles.filters}>
        {(['all', 'income', 'expense', 'transfer'] as TxType[]).map((t) => (
          <TouchableOpacity key={t} onPress={() => setFilterType(t)}
            style={[styles.filterBtn, filterType === t && styles.filterBtnActive]}>
            <Text style={[styles.filterBtnText, filterType === t && styles.filterBtnTextActive]}>
              {{ all: '全部', income: '收入', expense: '支出', transfer: '转账' }[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无记录</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#22c55e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  filterBtnActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  filterBtnText: { fontSize: 12, color: '#6b7280' },
  filterBtnTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 16, paddingTop: 0 },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  txIcon: { fontSize: 24, marginRight: 10 },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '500' },
  txMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: 'bold', marginRight: 8 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { color: '#d1d5db', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});
