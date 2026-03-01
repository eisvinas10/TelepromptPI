import { useState, useEffect, useRef, useCallback } from 'react';
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

export default function Home() {
  const [transcripts, setTranscripts] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchTranscripts = useCallback(async () => {
    try {
      const res = await axios.get('/api/transcripts');
      setTranscripts(res.data);
    } catch {
      /* silently fail */
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchTranscripts();
  }, [fetchTranscripts]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragover' || e.type === 'dragenter');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadError('');

    if (!file) {
      setUploadError('Please select a transcript file.');
      return;
    }
    if (!title.trim()) {
      setUploadError('Please enter a script name.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());

    setUploading(true);
    try {
      const res = await axios.post('/api/transcripts', formData);
      setTranscripts((prev) => [res.data, ...prev]);
      setTitle('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transcript?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/transcripts/${id}`);
      setTranscripts((prev) => prev.filter((t) => t.id !== id));
    } catch {
      /* silently fail */
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Transcript list */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Your Scripts</h2>
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
              <p className="text-neutral-400 text-sm">No scripts yet.</p>
              <p className="text-neutral-600 text-xs mt-1">Upload your first transcript below.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transcripts.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4 hover:border-neutral-700 transition-colors group"
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
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 text-xs rounded-lg transition-colors disabled:opacity-40"
                    >
                      {deletingId === t.id ? (
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrashIcon />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-xs text-neutral-600 uppercase tracking-widest">or upload new</span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        {/* Upload form */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-5">Upload Transcript</h2>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            {uploadError && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Script Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="e.g. Episode 12 Intro"
                />
              </div>

              {/* Drop zone */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Transcript File
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-500/5'
                      : file
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.text"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {file ? (
                    <div className="space-y-1">
                      <div className="text-2xl">✓</div>
                      <p className="text-sm font-medium text-emerald-400">{file.name}</p>
                      <p className="text-xs text-neutral-600">Click to change file</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-2xl text-neutral-600">
                        <UploadIcon />
                      </div>
                      <p className="text-sm text-neutral-400">
                        Drag &amp; drop your file here
                      </p>
                      <p className="text-xs text-neutral-600">
                        or <span className="text-indigo-400">click to browse</span> · .txt, .md
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading…
                  </>
                ) : (
                  'Upload Transcript'
                )}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

// Icon components
function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path d="M3 2.5l10 5.5-10 5.5V2.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
      <path d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l1 9.5A.5.5 0 004.5 14h7a.5.5 0 00.5-.5L13 4" strokeLinecap="round" strokeLinejoin="round" />
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

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mx-auto">
      <path d="M12 16V8M9 11l3-3 3 3M20 16.5A4 4 0 0017 9h-1A7 7 0 104 15.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
