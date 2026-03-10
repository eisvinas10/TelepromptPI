import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar.jsx';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Display() {
  const [transcripts, setTranscripts] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const navigate = useNavigate();

  const fetchTranscripts = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const res = await axios.get('/api/transcripts');
      setTranscripts(res.data);
    } catch {
      /* silently fail */
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTranscripts();
  }, [fetchTranscripts]);

  // Poll every 5 seconds for new scripts
  useEffect(() => {
    const interval = setInterval(() => fetchTranscripts(true), 5000);
    return () => clearInterval(interval);
  }, [fetchTranscripts]);

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar label="Display" />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Scripts</h2>
            <button
              onClick={fetchTranscripts}
              className="text-xs text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
            >
              <RefreshIcon />
              Refresh
            </button>
          </div>

          {loadingList ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transcripts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-neutral-800">
              <div className="text-3xl mb-3">📄</div>
              <p className="text-neutral-400 text-sm">No scripts available.</p>
              <p className="text-neutral-600 text-xs mt-1">Upload scripts from the user site.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transcripts.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4 hover:border-neutral-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white text-sm truncate">{t.title}</p>
                    <p className="text-xs text-neutral-600 mt-0.5">{formatDate(t.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => navigate(`/player/${t.id}`)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <PlayIcon />
                      Play
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path d="M3 2.5l10 5.5-10 5.5V2.5z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
      <path d="M13.5 8A5.5 5.5 0 112.5 5M2.5 2v3h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
