import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { accountApi, formatAmount, ACCOUNT_TYPE_LABELS } from '@jizhang/shared';
import type { Account } from '@jizhang/shared';

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = async () => setAccounts(await accountApi.list());
  useEffect(() => { load(); }, []);

  const handleDelete = (id: number) => {
    Alert.alert('删除账户', '确定删除吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive', onPress: async () => {
          try { await accountApi.remove(id); load(); }
          catch (e: any) { Alert.alert('错误', e.message); }
        }
      },
    ]);
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>我的账户</Text>
        <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ 新增</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>总资产</Text>
        <Text style={styles.balanceAmount}>¥{formatAmount(totalBalance)}</Text>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item: acc }) => (
          <View style={styles.accountCard}>
            <View style={[styles.accountIcon, { backgroundColor: (acc.color || '#22c55e') + '20' }]}>
              <Text style={{ fontSize: 24 }}>{acc.icon || '💰'}</Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{acc.name}</Text>
              <Text style={styles.accountType}>{ACCOUNT_TYPE_LABELS[acc.type]}</Text>
            </View>
            <Text style={[styles.accountBalance, { color: acc.balance >= 0 ? '#1f2937' : '#ef4444' }]}>
              ¥{formatAmount(acc.balance)}
            </Text>
            <TouchableOpacity onPress={() => handleDelete(acc.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <AccountFormModal visible={showForm} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
    </SafeAreaView>
  );
}

function AccountFormModal({ visible, onClose, onSaved }: {
  visible: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState('0');
  const [icon, setIcon] = useState('💰');

  const handleSubmit = async () => {
    if (!name) return Alert.alert('提示', '请输入账户名称');
    await accountApi.create({ name, type: type as any, balance: parseFloat(balance) || 0, icon });
    setName(''); setBalance('0'); setIcon('💰'); setType('cash');
    onSaved();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>新增账户</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <TextInput style={styles.input} placeholder="账户名称 *" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="初始余额" keyboardType="numeric" value={balance} onChangeText={setBalance} />
          <TextInput style={styles.input} placeholder="图标 (emoji)" value={icon} onChangeText={setIcon} maxLength={2} />
          <View style={styles.typeRow}>
            {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
              <TouchableOpacity key={k} onPress={() => setType(k)}
                style={[styles.typeBtn, type === k && styles.typeBtnActive]}>
                <Text style={[styles.typeBtnText, type === k && styles.typeBtnTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>保存</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#22c55e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  balanceCard: { margin: 16, marginTop: 0, backgroundColor: '#16a34a', borderRadius: 16, padding: 16 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  balanceAmount: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  list: { padding: 16, paddingTop: 0, gap: 10 },
  accountCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  accountIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: '600' },
  accountType: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  accountBalance: { fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { color: '#d1d5db', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  closeBtn: { color: '#9ca3af', fontSize: 18 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 14 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  typeBtnText: { fontSize: 12, color: '#6b7280' },
  typeBtnTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
