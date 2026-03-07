import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { useStore } from '../../store/useStore';
import { formatAmount } from '@jizhang/shared';
import type { Transaction } from '@jizhang/shared';

export default function Dashboard() {
  const { summary, accounts, transactions, fetchSummary, fetchAccounts, fetchTransactions } = useStore();
  const router = useRouter();
  const year = dayjs().year();
  const month = dayjs().month() + 1;

  useEffect(() => {
    fetchSummary(year, month);
    fetchAccounts();
    fetchTransactions({ limit: 5 });
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💰 Parker 记账</Text>
          <TouchableOpacity onPress={() => router.push('/transaction/new')} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ 记账</Text>
          </TouchableOpacity>
        </View>

        {/* 总资产 */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>总资产</Text>
          <Text style={styles.balanceAmount}>¥{formatAmount(totalBalance)}</Text>
          <Text style={styles.balanceDate}>{dayjs().format('YYYY年MM月DD日')}</Text>
        </View>

        {/* 本月收支 */}
        {summary && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>本月收支</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>收入</Text>
                <Text style={[styles.summaryAmount, { color: '#22c55e' }]}>¥{formatAmount(summary.income)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>支出</Text>
                <Text style={[styles.summaryAmount, { color: '#ef4444' }]}>¥{formatAmount(summary.expense)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>结余</Text>
                <Text style={[styles.summaryAmount, { color: summary.balance >= 0 ? '#22c55e' : '#ef4444' }]}>
                  ¥{formatAmount(summary.balance)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 账户 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>我的账户</Text>
          {accounts.map((acc) => (
            <View key={acc.id} style={styles.accountRow}>
              <Text style={styles.accountIcon}>{acc.icon || '💰'}</Text>
              <Text style={styles.accountName}>{acc.name}</Text>
              <Text style={[styles.accountBalance, { color: acc.balance >= 0 ? '#1f2937' : '#ef4444' }]}>
                ¥{formatAmount(acc.balance)}
              </Text>
            </View>
          ))}
        </View>

        {/* 最近交易 */}
        <View style={[styles.card, { marginBottom: 32 }]}>
          <Text style={styles.cardTitle}>最近交易</Text>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>暂无记录，去记一笔吧～</Text>
          ) : (
            transactions.map((tx: Transaction) => (
              <View key={tx.id} style={styles.txRow}>
                <Text style={styles.txIcon}>{tx.category_icon || '📦'}</Text>
                <View style={styles.txInfo}>
                  <Text style={styles.txName}>{tx.category_name || '转账'}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, {
                  color: tx.type === 'income' ? '#22c55e' : tx.type === 'expense' ? '#ef4444' : '#3b82f6'
                }]}>
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}¥{formatAmount(tx.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },
  addBtn: { backgroundColor: '#22c55e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  balanceCard: {
    margin: 16, marginTop: 0,
    backgroundColor: '#16a34a', borderRadius: 20, padding: 20,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  balanceDate: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  card: { margin: 16, marginTop: 0, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 13, color: '#9ca3af', fontWeight: '500', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#9ca3af' },
  summaryAmount: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  accountRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  accountIcon: { fontSize: 22, marginRight: 10 },
  accountName: { flex: 1, fontSize: 14, fontWeight: '500' },
  accountBalance: { fontSize: 14, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: 14, paddingVertical: 16 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  txIcon: { fontSize: 22, marginRight: 10 },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '500' },
  txDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: 'bold' },
});
