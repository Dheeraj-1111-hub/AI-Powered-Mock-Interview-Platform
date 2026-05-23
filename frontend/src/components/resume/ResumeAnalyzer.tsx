import { useState } from 'react';
import { analyzeResume } from '../../services/api.service';

const ResumeAnalyzer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      const response = await analyzeResume(file);
      setResult(response.data.analysis);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Resume upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-soft backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-white">AI Resume Analyzer</h2>
      <p className="mt-3 text-slate-400">Upload your resume to receive ATS scoring, keyword gaps, and role recommendations.</p>
      <div className="mt-6 flex gap-3 flex-wrap">
        <label className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 cursor-pointer hover:bg-slate-800">
          Select PDF
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button onClick={handleUpload} disabled={!file || loading} className="rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:bg-slate-700">
          {loading ? 'Analyzing...' : 'Analyze resume'}
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
      {result && (
        <div className="mt-6 space-y-4 rounded-3xl bg-slate-950/90 p-6 text-sm text-slate-200">
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;
