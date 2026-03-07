import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { useStore } from '../../store/useStore';
import { formatAmount } from '@jizhang/shared';

export default function Statistics() {
  const { summary, fetchSummary } = useStore();
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);

  useEffect(() => {
    fetchSummary(year, month);
  }, [year, month]);

  const expenseData = summary?.byCategory.filter((c) => c.type === 'expense') || [];
  const maxExpense = expenseData.reduce((m, c) => Math.max(m, c.total), 0);

  const COLORS = ['#FF6B6B', '#FF9F43', '#A29BFE', '#FD79A8', '#55EFC4', '#74B9FF', '#FDCB6E', '#B2BEC3'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>统计分析</Text>

        {/* 月份选择 */}
        <View style={styles.monthPicker}>
          <TouchableOpacity onPress={() => {
            const d = dayjs(`${year}-${String(month).padStart(2,'0')}-01`).subtract(1, 'month');
            setYear(d.year()); setMonth(d.month() + 1);
          }} style={styles.arrowBtn}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>{year}年{month}月</Text>
          <TouchableOpacity onPress={() => {
            const d = dayjs(`${year}-${String(month).padStart(2,'0')}-01`).add(1, 'month');
            setYear(d.year()); setMonth(d.month() + 1);
          }} style={styles.arrowBtn}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 收支汇总 */}
        {summary && (
          <View style={styles.card}>
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

        {/* 支出分类 */}
        {expenseData.length > 0 && (
          <View style={[styles.card, { marginBottom: 32 }]}>
            <Text style={styles.cardTitle}>支出分类</Text>
            {expenseData.map((c, i) => (
              <View key={c.id} style={styles.categoryRow}>
                <Text style={styles.categoryIcon}>{c.icon}</Text>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>{c.name}</Text>
                    <Text style={styles.categoryAmount}>¥{formatAmount(c.total)}</Text>
                  </View>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, {
                      width: `${maxExpense > 0 ? (c.total / maxExpense) * 100 : 0}%` as any,
                      backgroundColor: COLORS[i % COLORS.length],
                    }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {expenseData.length === 0 && (
          <Text style={styles.emptyText}>本月暂无支出记录</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', margin: 16, marginBottom: 8 },
  monthPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, gap: 16 },
  arrowBtn: { padding: 8 },
  arrowText: { fontSize: 24, color: '#22c55e' },
  monthText: { fontSize: 18, fontWeight: '600' },
  card: { margin: 16, marginTop: 0, backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 14, color: '#9ca3af', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#9ca3af' },
  summaryAmount: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryIcon: { fontSize: 24, marginRight: 10 },
  categoryInfo: { flex: 1 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoryName: { fontSize: 13, fontWeight: '500' },
  categoryAmount: { fontSize: 13, fontWeight: 'bold', color: '#ef4444' },
  progressBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});
