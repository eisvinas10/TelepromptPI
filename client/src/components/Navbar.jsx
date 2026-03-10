import { Link } from 'react-router-dom';

export default function Navbar({ label }) {
  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="TelepromptPI" className="h-8 w-auto" />
        </Link>
        {label && (
          <span className="text-xs text-neutral-500 uppercase tracking-widest">{label}</span>
        )}
      </div>
    </nav>
  );
}
