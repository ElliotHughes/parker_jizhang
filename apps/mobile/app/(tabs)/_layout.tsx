import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: '#22c55e',
        tabBarStyle: { borderTopColor: '#f3f4f6', paddingBottom: 4 },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: '概览',
        tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
      }} />
      <Tabs.Screen name="transactions" options={{
        title: '记账',
        tabBarIcon: ({ focused }) => <TabIcon emoji="📝" focused={focused} />,
      }} />
      <Tabs.Screen name="statistics" options={{
        title: '统计',
        tabBarIcon: ({ focused }) => <TabIcon emoji="📈" focused={focused} />,
      }} />
      <Tabs.Screen name="accounts" options={{
        title: '账户',
        tabBarIcon: ({ focused }) => <TabIcon emoji="💳" focused={focused} />,
      }} />
    </Tabs>
  );
}
