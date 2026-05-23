import { useState } from 'react';
import { generateInterviewPlan } from '../../services/api.service';

const InterviewGenerator = () => {
  const [form, setForm] = useState({ role: 'Software Engineer', experience: '3 years', stack: 'React, Node.js, MongoDB', companyType: 'scaleup' });
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const response = await generateInterviewPlan(form);
    setPlan(JSON.stringify(response.data.plan, null, 2));
    setLoading(false);
  };

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-soft backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">AI Interview Generator</h2>
          <p className="mt-3 text-slate-400">Generate HR, technical, and coding round questions for your target role.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          { label: 'Role', key: 'role' },
          { label: 'Experience', key: 'experience' },
          { label: 'Tech stack', key: 'stack' },
          { label: 'Company type', key: 'companyType' },
        ].map((field) => (
          <label key={field.key} className="block text-sm text-slate-300">
            {field.label}
            <input
              value={(form as any)[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-500"
            />
          </label>
        ))}
      </div>

      <button onClick={handleGenerate} disabled={loading} className="mt-6 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-70">
        {loading ? 'Generating...' : 'Create interview plan'}
      </button>

      {plan && (
        <div className="mt-6 rounded-3xl bg-slate-950/90 p-5 text-sm text-slate-200">
          <pre className="whitespace-pre-wrap">{plan}</pre>
        </div>
      )}
    </div>
  );
};

export default InterviewGenerator;
