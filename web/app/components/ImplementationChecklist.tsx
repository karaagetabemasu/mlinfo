import type { Article } from "@/app/data/dummy";
import { getImplementationChecklist } from "@/lib/articleInsights";

const STATUS_CLASS = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  unknown: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

const STATUS_LABEL = {
  ok: "OK",
  warning: "要確認",
  unknown: "未取得",
};

export default function ImplementationChecklist({ article }: { article: Article }) {
  const items = getImplementationChecklist(article);

  return (
    <section className="bg-white border border-zinc-200 p-5">
      <h2 className="text-sm font-semibold text-zinc-900 mb-3">実装チェックリスト</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="border border-zinc-100 bg-zinc-50 px-3 py-2">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium text-zinc-900">{item.label}</h3>
              <span className={`text-xs border px-2 py-0.5 shrink-0 ${STATUS_CLASS[item.status]}`}>
                {STATUS_LABEL[item.status]}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-600 mt-1">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
