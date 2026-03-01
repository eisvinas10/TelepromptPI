import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white group-hover:bg-indigo-500 transition-colors">
            T
          </div>
          <span className="font-semibold text-white tracking-tight text-sm">
            TelepromptPI
          </span>
        </Link>
      </div>
    </nav>
  );
}
