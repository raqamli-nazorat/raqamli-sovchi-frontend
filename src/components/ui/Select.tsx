import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';

// Base select props
interface BaseSelectProps {
  placeholder?: string;
  className?: string;
  hasMore?: boolean;
  loadingMore?: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
}

// Single select props
interface SelectSingleProps extends BaseSelectProps {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
  options: string[] | { value: string; label: string }[];
}

// Multiple select props
interface SelectMultipleProps extends BaseSelectProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
  options: string[] | { value: string; label: string }[];
}

type SelectProps = SelectSingleProps | SelectMultipleProps;

const Select = (props: SelectProps) => {
  const {
    options,
    placeholder = "Tanlang...",
    className = "",
    hasMore = false,
    loadingMore = false,
    loading = false,
    onLoadMore,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  }>({
    left: 0,
    width: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // max-h of the dropdown
      const margin = 4;
      const viewportHeight = window.innerHeight;

      // Check if there is enough space below
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < dropdownHeight + margin && spaceAbove > spaceBelow) {
        // Place above: set bottom, clear top
        setCoords({
          bottom: viewportHeight - rect.top + margin,
          left: rect.left,
          width: rect.width,
        });
      } else {
        // Place below: set top, clear bottom
        setCoords({
          top: rect.bottom + margin,
          left: rect.left,
          width: rect.width,
        });
      }
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScroll = () => {
        updateCoords();
      };
      window.addEventListener("resize", handleScroll);
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        window.removeEventListener("resize", handleScroll);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
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

  const isMultiple = props.multiple === true;
  const multipleValue = isMultiple ? (props.value as string[]) : [];
  const singleValue = !isMultiple ? (props.value as string) : "";

  const isSelected = (optValue: string) => {
    if (isMultiple) return multipleValue.includes(optValue);
    return singleValue === optValue;
  };

  const handleSelect = (optValue: string) => {
    if (isMultiple) {
      const current = multipleValue;
      let next: string[];
      if (current.includes(optValue)) {
        next = current.filter((v) => v !== optValue);
      } else {
        next = [...current, optValue];
      }
      (props as SelectMultipleProps).onChange(next);
      // keep open for multi select
    } else {
      (props as SelectSingleProps).onChange(optValue);
      setIsOpen(false);
    }
  };

  const handleRemoveTag = (e: React.MouseEvent, optValue: string) => {
    e.stopPropagation();
    if (isMultiple) {
      const next = multipleValue.filter((v) => v !== optValue);
      (props as SelectMultipleProps).onChange(next);
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMultiple) {
      (props as SelectMultipleProps).onChange([]);
    } else {
      (props as SelectSingleProps).onChange("");
    }
  };

  const selectedTags = isMultiple
    ? selectOptions.filter((opt) => multipleValue.includes(opt.value))
    : [];

  const hasValue = isMultiple ? multipleValue.length > 0 : !!singleValue;
  const singleSelectedOption = !isMultiple ? selectOptions.find((opt) => opt.value === singleValue) : null;

  const displayText = isMultiple
    ? (multipleValue.length === 0 ? placeholder : `${multipleValue.length} ta tanlangan`)
    : (singleSelectedOption ? singleSelectedOption.label : placeholder);

  const handleDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (
      hasMore &&
      !loadingMore &&
      onLoadMore &&
      target.scrollTop + target.clientHeight >= target.scrollHeight - 25
    ) {
      onLoadMore();
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          updateCoords();
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between pl-3.5 pr-3 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0a0a0a] dark:text-[#fafafa] outline-none cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors focus:border-[#0474F3]"
      >
        <span className={`truncate mr-2 ${!hasValue ? 'text-[#a3a3a3] dark:text-[#525252]' : ''}`}>
          {displayText}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasValue && (
            <span
              onClick={handleClearAll}
              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Selected tags — only for multiple mode */}
      {isMultiple && selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.value}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0474F3]/10 text-[#0474F3] text-[12px] font-medium rounded-lg"
            >
              {tag.label}
              <button
                type="button"
                onClick={(e) => handleRemoveTag(e, tag.value)}
                className="ml-0.5 hover:text-[#023399] transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen && coords.width > 0 && createPortal(
        <div
          ref={dropdownRef}
          onScroll={handleDropdownScroll}
          style={{
            position: 'fixed',
            top: coords.top !== undefined ? `${coords.top}px` : undefined,
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
          }}
          className="z-[999999] bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl shadow-lg overflow-y-auto max-h-[200px] py-1 animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
          {loading && selectOptions.length === 0 ? (
            <div className="flex items-center justify-center py-4 text-gray-400">
              <div className="w-4 h-4 border-2 border-[#0474F3] border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-[12px] text-[#737373] dark:text-[#a3a3a3]">Yuklanmoqda...</span>
            </div>
          ) : selectOptions.length === 0 ? (
            <div className="px-3.5 py-3 text-[13px] text-center text-[#737373] dark:text-[#a3a3a3]">
              Ma'lumot topilmadi
            </div>
          ) : (
            selectOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`px-3.5 py-2.5 text-[13px] transition-colors cursor-pointer flex items-center justify-between ${
                  isSelected(opt.value)
                    ? 'bg-[#0474F3]/5 dark:bg-[#0474F3]/10 text-[#0474F3] font-medium'
                    : 'text-[#404040] dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected(opt.value) && <Check className="w-3.5 h-3.5 text-[#0474F3] stroke-[2.5]" />}
              </div>
            ))
          )}

          {loadingMore && (
            <div className="flex items-center justify-center py-2.5 text-gray-400">
              <div className="w-4 h-4 border-2 border-[#0474F3] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default Select;