import { IconSearch } from "../Icons";

type Props = {
  value: string;
  isFetching: boolean;
  onChange: (val: string) => void;
  onFocus: () => void;
};

export function SearchInput({ value, isFetching, onChange, onFocus }: Props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
        {isFetching ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-lagoon" />
        ) : (
          <IconSearch className="h-5 w-5" />
        )}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Search products, categories…"
        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-base text-white placeholder-slate-500 shadow-panel backdrop-blur transition focus:border-lagoon/60 focus:outline-none focus:ring-2 focus:ring-lagoon/30"
        autoFocus
      />
    </div>
  );
}
