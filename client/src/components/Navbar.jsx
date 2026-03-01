import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white group-hover:bg-indigo-500 transition-colors">
            T
          </div>
          <span className="font-semibold text-white tracking-tight text-sm">
            TelepromptPI
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-neutral-500 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-neutral-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-800"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
