import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/incidents/new', label: 'New Incident' },
  { to: '/runbooks', label: 'Runbooks' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-black h-screen flex flex-col fixed left-0 top-0 border-r border-zinc-800">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white tracking-tight">OpsIncidentAI</h1>
        <p className="text-zinc-500 text-xs mt-1 uppercase tracking-wider">AI Incident Management</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/incidents'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-zinc-500 text-xs mt-1 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-center border border-zinc-800 px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
