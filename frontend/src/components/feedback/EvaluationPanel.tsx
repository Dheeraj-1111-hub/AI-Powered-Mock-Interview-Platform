import { useState } from 'react';
import { evaluateAnswer } from '../../services/api.service';

const EvaluationPanel = () => {
  const [question, setQuestion] = useState('Describe a scalable server architecture you built.');
  const [answer, setAnswer] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEvaluate = async () => {
    setLoading(true);
    const response = await evaluateAnswer({ question, answer, role: 'Software Engineer' });
    setReport(JSON.stringify(response.data.evaluation, null, 2));
    setLoading(false);
  };

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-soft backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-white">AI Evaluation Engine</h2>
      <p className="mt-3 text-slate-400">Paste your answer and receive feedback on clarity, correctness, and confidence.</p>
      <div className="mt-6 space-y-4">
        <label className="block text-sm text-slate-300">
          Interview question
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-500" rows={2} />
        </label>
        <label className="block text-sm text-slate-300">
          Your answer
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-500" rows={5} />
        </label>
      </div>
      <button onClick={handleEvaluate} disabled={loading || !answer} className="mt-5 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-70">
        {loading ? 'Evaluating...' : 'Evaluate answer'}
      </button>
      {report && (
        <div className="mt-6 rounded-3xl bg-slate-950/90 p-5 text-sm text-slate-200">
          <pre className="whitespace-pre-wrap">{report}</pre>
        </div>
      )}
    </div>
  );
};

export default EvaluationPanel;
