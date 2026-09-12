import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/review-queue', label: 'Review Queue' },
  { to: '/sandbox', label: 'What-If Sandbox' },
  { to: '/insights', label: 'Model Insights' },
];

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <nav className="flex gap-6 border-b p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? 'font-semibold underline' : 'text-muted-foreground'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
