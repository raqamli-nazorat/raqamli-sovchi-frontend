import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[] | { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

const Select = ({ value, onChange, options, placeholder = "Tanlang...", className = "" }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectOptions = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = selectOptions.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between pl-3.5 pr-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0a0a0a] dark:text-[#fafafa] outline-none cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors focus:border-[#FF5900]"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-50 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl shadow-lg overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {selectOptions.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-3.5 py-2.5 text-[13px] transition-colors cursor-pointer flex items-center justify-between ${
                value === opt.value
                  ? 'bg-[#FF5900]/5 dark:bg-[#FF5900]/10 text-[#FF5900] font-medium'
                  : 'text-[#404040] dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5 text-[#FF5900] stroke-[2.5]" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;
