import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { format } from "date-fns"
import dayjs from "dayjs"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, CheckIcon } from "lucide-react"

interface CalendarDropdownOption {
  value: string | number
  label: string
}

interface CalendarDropdownProps {
  value?: string | number
  onChange?: (e: { target: { value: string } }) => void
  options?: CalendarDropdownOption[]
  className?: string
}

// ─── Custom Dropdown ───────────────────────────────────────────────────────────
function CalendarDropdown({ value, onChange, options, className, ...props }: CalendarDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const selected = options?.find((o) => String(o.value) === String(value))

  return (
    <div ref={ref} className="relative" {...props}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium",
          "hover:bg-gray-100 cursor-pointer select-none transition-colors",
          "text-[#0a0a0a]",
          className
        )}
      >
        <span>{selected?.label}</span>
        <ChevronDownIcon
          className={cn("size-3.5 opacity-60 transition-transform duration-150", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-1 z-50 min-w-[7rem] rounded-lg border shadow-lg py-1 overflow-y-auto max-h-52",
            "bg-white border-[#e5e5e5] text-[#0a0a0a]",
            "left-0"
          )}
        >
          {options?.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange?.({ target: { value: String(opt.value) } })
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-1.5 text-sm cursor-pointer transition-colors",
                "hover:bg-gray-50 hover:text-[#0a0a0a]",
                String(opt.value) === String(value) && "font-semibold text-[#0474F3]"
              )}
            >
              {opt.label}
              {String(opt.value) === String(value) && (
                <CheckIcon className="size-3.5 text-[#0474F3] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface CalendarContextValue {
  daterange?: boolean
  selected?: any
  onSelect?: (range: { from: Date | undefined; to: Date | undefined }) => void
}

const CalendarContext = React.createContext<CalendarContextValue>({
  daterange: false,
  selected: null,
  onSelect: undefined,
})

export type CalendarProps = Omit<React.ComponentPropsWithoutRef<typeof DayPicker>, "selected" | "onSelect"> & {
  daterange?: boolean
  selected?: any
  onSelect?: any
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  daterange = false,
  selected,
  onSelect,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()

  const DayPickerComp = DayPicker as any

  return (
    <CalendarContext.Provider value={{ daterange, selected, onSelect }}>
      <DayPickerComp
        showOutsideDays={showOutsideDays}
        className={cn(
          "group/calendar bg-white dark:bg-white text-[#0a0a0a] p-3 [--cell-radius:6px] [--cell-size:36px]",
          String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
          String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
          className
        )}
        captionLayout={captionLayout}
        locale={locale}
        formatters={{
          formatMonthDropdown: (date: Date) =>
            locale ? format(date, "LLLL", { locale: locale as any }) : date.toLocaleString(undefined, { month: "long" }),
          ...formatters,
        }}
        classNames={{
          root: cn("w-fit", defaultClassNames.root),
          months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
          month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
          nav: cn(
            "absolute inset-x-0 top-0 flex w-full items-center justify-between",
            defaultClassNames.nav
          ),
          button_previous: cn(
            buttonVariants({ variant: buttonVariant }),
            "h-7 w-7 p-0 select-none opacity-50 hover:opacity-100 aria-disabled:opacity-30",
            defaultClassNames.button_previous
          ),
          button_next: cn(
            buttonVariants({ variant: buttonVariant }),
            "h-7 w-7 p-0 select-none opacity-50 hover:opacity-100 aria-disabled:opacity-30",
            defaultClassNames.button_next
          ),
          month_caption: cn(
            "flex h-7 w-full items-center justify-center px-8",
            defaultClassNames.month_caption
          ),
          dropdowns: cn(
            "flex h-7 w-full items-center justify-center gap-1 text-sm font-medium",
            defaultClassNames.dropdowns
          ),
          dropdown_root: cn(
            "relative",
            defaultClassNames.dropdown_root
          ),
          dropdown: cn(
            "hidden",
            defaultClassNames.dropdown
          ),
          caption_label: cn(
            "flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium hover:bg-accent cursor-pointer select-none",
            defaultClassNames.caption_label
          ),
          weekdays: cn("flex", defaultClassNames.weekdays),
          weekday: cn(
            "w-9 text-center text-[0.8rem] font-normal text-[#737373] select-none py-1",
            defaultClassNames.weekday
          ),
          week: cn("flex w-full mt-1", defaultClassNames.week),
          week_number_header: cn("w-9 select-none", defaultClassNames.week_number_header),
          week_number: cn(
            "text-[0.8rem] text-muted-foreground select-none",
            defaultClassNames.week_number
          ),
          day: cn(
            "relative h-9 w-9 p-0 text-center select-none",
            defaultClassNames.day
          ),
          range_start: cn(
            "rounded-l-md bg-accent",
            defaultClassNames.range_start
          ),
          range_middle: cn("rounded-none bg-accent", defaultClassNames.range_middle),
          range_end: cn(
            "rounded-r-md bg-accent",
            defaultClassNames.range_end
          ),
          today: cn(
            "font-semibold text-foreground",
            defaultClassNames.today
          ),
          outside: cn(
            "text-muted-foreground opacity-50 aria-selected:text-muted-foreground",
            defaultClassNames.outside
          ),
          disabled: cn("text-muted-foreground opacity-30", defaultClassNames.disabled),
          hidden: cn("invisible", defaultClassNames.hidden),
          ...classNames,
        }}
        components={{
          Root: ({ className, rootRef, ...props }: any) => {
            return (<div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />)
          },
          Chevron: ({ className, orientation, ...props }: any) => {
            if (orientation === "left") {
              return (<ChevronLeftIcon className={cn("size-4", className)} {...props} />)
            }
            if (orientation === "right") {
              return (<ChevronRightIcon className={cn("size-4", className)} {...props} />)
            }
            return (<ChevronDownIcon className={cn("size-4", className)} {...props} />)
          },
          Dropdown: (dropdownProps: any) => (
            <CalendarDropdown {...dropdownProps} />
          ),
          DayButton: ({ ...props }: any) => (
            <CalendarDayButton locale={locale} {...props} />
          ),
          WeekNumber: ({ children, ...props }: any) => {
            return (
              <td {...props}>
                <div className="flex size-9 items-center justify-center text-center">
                  {children}
                </div>
              </td>
            )
          },
          ...components,
        }}
        selected={daterange ? undefined : selected}
        onSelect={daterange ? undefined : onSelect}
        {...props}
      />
    </CalendarContext.Provider>
  )
}

interface CalendarDayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  day: { date: Date }
  modifiers: {
    focused?: boolean
    selected?: boolean
    range_start?: boolean
    range_end?: boolean
    range_middle?: boolean
    today?: boolean
    outside?: boolean
    disabled?: boolean
  }
  locale?: any
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: CalendarDayButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const { daterange, selected, onSelect } = React.useContext(CalendarContext)

  const isRangeStart = daterange && selected?.from && dayjs(day.date).isSame(selected.from, 'day')
  const isRangeEnd = daterange && selected?.to && dayjs(day.date).isSame(selected.to, 'day')
  const isRangeMiddle = daterange && selected?.from && selected?.to &&
    dayjs(day.date).isAfter(selected.from, 'day') &&
    dayjs(day.date).isBefore(selected.to, 'day')

  const isStart = daterange ? isRangeStart : modifiers.range_start
  const isEnd = daterange ? isRangeEnd : modifiers.range_end
  const isMiddle = daterange ? isRangeMiddle : modifiers.range_middle
  const isSelectedSingle = daterange
    ? (selected?.from && !selected?.to && dayjs(day.date).isSame(selected.from, 'day'))
    : (modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (daterange) {
      e.preventDefault()
      e.stopPropagation()

      if (onSelect) {
        const clickedDate = day.date
        let newRange
        if (!selected || !selected.from || (selected.from && selected.to)) {
          newRange = { from: clickedDate, to: undefined }
        } else {
          const fromDate = dayjs(selected.from)
          const clicked = dayjs(clickedDate)
          if (clicked.isBefore(fromDate)) {
            newRange = { from: clickedDate, to: selected.from }
          } else {
            newRange = { from: selected.from, to: clickedDate }
          }
        }
        onSelect(newRange)
      }
    } else {
      props.onClick?.(e)
    }
  }

  return (
    <button
      {...props}
      ref={ref}
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={isSelectedSingle}
      data-range-start={isStart}
      data-range-end={isEnd}
      data-range-middle={isMiddle}
      data-today={modifiers.today}
      data-outside={modifiers.outside}
      data-disabled={modifiers.disabled}
      title={daterange ? "Tanlash uchun bosing" : undefined}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-normal transition-colors text-[#0a0a0a]",
        "cursor-pointer select-none outline-none",
        "hover:bg-gray-100 hover:text-[#0a0a0a]",
        "focus-visible:ring-2 focus-visible:ring-[#0474F3] focus-visible:ring-offset-1",
        "data-[selected-single=true]:bg-[#0a0a0a] data-[selected-single=true]:text-white data-[selected-single=true]:rounded-md data-[selected-single=true]:hover:bg-[#262626]",
        "data-[range-start=true]:bg-[#0a0a0a] data-[range-start=true]:text-white data-[range-start=true]:rounded-l-md",
        "data-[range-end=true]:bg-[#0a0a0a] data-[range-end=true]:text-white data-[range-end=true]:rounded-r-md",
        "data-[range-middle=true]:bg-[#f5f5f5] data-[range-middle=true]:text-[#0a0a0a] data-[range-middle=true]:rounded-none",
        "data-[outside=true]:text-[#737373] data-[outside=true]:opacity-50",
        "data-[disabled=true]:text-[#a3a3a3] data-[disabled=true]:opacity-30 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:pointer-events-none",
        className
      )}
      onClick={handleClick}
    />
  )
}

export { Calendar, CalendarDayButton }
