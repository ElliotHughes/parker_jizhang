import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Categories from './pages/Categories';
import Statistics from './pages/Statistics';

const navItems = [
  { to: '/', label: '概览', icon: '📊' },
  { to: '/transactions', label: '记账', icon: '📝' },
  { to: '/statistics', label: '统计', icon: '📈' },
  { to: '/accounts', label: '账户', icon: '💳' },
  { to: '/categories', label: '分类', icon: '🏷️' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2 sticky top-0 z-10 shadow-sm">
        <span className="text-2xl">💰</span>
        <h1 className="text-xl font-bold text-primary-600">Parker 记账</h1>
      </header>

      <main className="flex-1 px-4 py-6 pb-24">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </main>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-gray-100 flex shadow-lg">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                isActive ? 'text-primary-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
