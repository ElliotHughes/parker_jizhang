import { Stack } from 'expo-router';

export default function TransactionLayout() {
  return (
    <Stack>
      <Stack.Screen name="new" options={{ title: '记一笔', headerBackTitle: '返回' }} />
    </Stack>
  );
}
