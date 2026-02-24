type Props = { score: number };

export function ScoreBadge({ score }: Props) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 70
      ? "bg-lime/15 text-lime"
      : pct >= 45
        ? "bg-lagoon/15 text-lagoon"
        : "bg-white/[0.07] text-slate-500";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}
    >
      {pct}%
    </span>
  );
}
