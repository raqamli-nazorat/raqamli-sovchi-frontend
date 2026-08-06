interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  className?: string;
}

// 3(or N)-way segmented toggle, matches Figma "Kimga" / "Tuzoq savol" / "Asosiy rol" controls.
// Convention used across this app: the FIRST option represents "no filter" (empty value),
// the remaining options are the actual filter values.
const SegmentedControl = ({ value, onChange, options, className = "" }: SegmentedControlProps) => {
  return (
    <div className={`flex items-center bg-[#F5F5F5] dark:bg-zinc-800/60 rounded-xl p-1 ${className}`}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 h-9 text-[13px] rounded-lg transition-all cursor-pointer ${
              active
                ? "bg-white dark:bg-zinc-900 text-[#0a0a0a] dark:text-[#fafafa] font-semibold shadow-sm"
                : "text-[#a3a3a3] dark:text-zinc-500 font-medium hover:text-[#737373] dark:hover:text-zinc-400"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;