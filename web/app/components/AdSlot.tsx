type Props = {
  label?: string;
  className?: string;
};

export default function AdSlot({ label = "広告枠", className = "" }: Props) {
  return (
    <aside
      aria-label={label}
      className={`border border-dashed border-zinc-200 bg-white px-4 py-5 text-center text-xs text-zinc-400 ${className}`}
    >
      {label}
    </aside>
  );
}
