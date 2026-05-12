import type { Article } from "@/app/data/dummy";
import {
  getActiveManufacturingSignals,
  getClaudeCodePrompt,
  getInternalizationSteps,
  getManufacturingFitScore,
} from "@/lib/articleInsights";
import CopyPromptButton from "@/app/components/CopyPromptButton";

export default function InternalizationGuide({ article }: { article: Article }) {
  const signals = getActiveManufacturingSignals(article);
  const steps = getInternalizationSteps(article);
  const prompt = getClaudeCodePrompt(article);
  const fitScore = getManufacturingFitScore(article);

  return (
    <section className="bg-white border border-zinc-200 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">自社データで試すなら</h2>
          <p className="text-xs text-zinc-500 mt-1">
            製造業・材料開発のExcel/CSVデータに落とし込むための最初の手順です。
          </p>
        </div>
        <span className="text-xs border border-cyan-100 bg-cyan-50 px-2 py-1 text-cyan-700 shrink-0">
          製造業適性 {fitScore}
        </span>
      </div>

      {signals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {signals.map((signal) => (
            <span key={signal.key} className="text-xs border border-cyan-100 bg-cyan-50 px-2 py-0.5 text-cyan-700">
              {signal.label}
            </span>
          ))}
        </div>
      )}

      <ol className="space-y-2 text-sm text-zinc-700 mb-4">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="text-xs font-mono text-zinc-400 w-5 shrink-0">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <CopyPromptButton prompt={prompt} />
    </section>
  );
}
