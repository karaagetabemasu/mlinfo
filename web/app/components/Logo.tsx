import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <span className="text-lg font-bold tracking-widest text-zinc-900 group-hover:text-zinc-600 transition-colors">
        MLinfo
      </span>
      <span className="text-zinc-300 text-xs hidden sm:block">|</span>
      <span className="text-zinc-500 text-xs hidden sm:block">日々更新される技術をキャッチアップ</span>
    </Link>
  );
}
