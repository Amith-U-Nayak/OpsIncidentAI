import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/incidents/new', label: 'New Incident' },
  { to: '/runbooks', label: 'Runbooks' },
  { to: '/guide', label: 'Documentation' },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-black border-r border-zinc-800 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:w-72 md:flex-shrink-0`}>
        
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">OpsIncidentAI</h1>
            <p className="text-zinc-500 text-sm mt-1 uppercase tracking-wider">AI Incident Management</p>
          </div>
          {/* Mobile Close Button */}
          <button className="md:hidden text-zinc-400 hover:text-white text-2xl" onClick={() => setIsOpen(false)}>×</button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/incidents'}
              onClick={() => setIsOpen(false)} // Close on mobile when clicked
              className={({ isActive }) =>
                `block px-4 py-3 rounded-md text-base font-medium transition-all ${
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
        <div className="p-6 border-t border-zinc-800">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-white text-base font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-base font-medium leading-none">{user?.name}</p>
              <p className="text-zinc-500 text-sm mt-1 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-center border border-zinc-800 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md text-base transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
