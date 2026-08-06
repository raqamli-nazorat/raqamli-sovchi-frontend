"use client"

import * as React from "react"
import { useState, useEffect, useId } from "react"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"

import "dayjs/locale/uz"
import "dayjs/locale/uz-latn"
import "dayjs/locale/ru"
import "dayjs/locale/en"
import "dayjs/locale/tr"

dayjs.extend(customParseFormat)

import { uz, uzCyrl, ru, enUS } from "date-fns/locale"

import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"

import {
     Popover,
     PopoverContent,
     PopoverTrigger,
} from "./popover"
import { Calendar as CalendarIcon, X as XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const calendarLocales: Record<string, any> = {
     uz: uz,
     cy: uzCyrl,
     ru: ru,
     en: enUS,
}

// Date | string | null -> JS Date | null
const toDateObj = (v: any): Date | null => {
     if (!v) return null
     if (v instanceof Date) return isNaN(v.getTime()) ? null : v
     // Dayjs parsing for DD.MM.YYYY HH:mm / DD.MM.YYYY formats
     const parsed = dayjs(v, ["DD.MM.YYYY HH:mm", "DD.MM.YYYY", "YYYY-MM-DD HH:mm", "YYYY-MM-DD"], true)
     if (parsed.isValid()) return parsed.toDate()
     const d = new Date(v)
     return isNaN(d.getTime()) ? null : d
}

export interface DatePickerProps {
     currentLang?: string
     label?: string
     placeholder?: string
     showTime?: boolean
     className?: string
     inputClassName?: string
     widthClass?: string
     labelClassName?: string
     calendarIcon?: React.ReactNode
     value?: any
     onChange?: (date: Date | null) => void
     error?: boolean
     errorText?: string
     id?: string
     minDate?: any
     maxDate?: any
     disabled?: boolean
}

export const DatePicker = ({
     currentLang = "uz",
     label,
     placeholder,
     showTime = false,
     className = "",
     inputClassName = "",
     widthClass = "w-52",
     labelClassName = "",
     calendarIcon,
     value,
     onChange,
     error = false,
     errorText,
     id,
     minDate,
     maxDate,
     disabled = false,
     ...props
}: DatePickerProps) => {
     const autoId = useId()
     const fieldId = id || `date-${autoId}`

     const [open, setOpen] = useState(false)
     const [date, setDate] = useState(() => toDateObj(value))
     const [month, setMonth] = useState(toDateObj(value) || new Date())

     const currentFormat = showTime ? "DD.MM.YYYY HH:mm" : "DD.MM.YYYY"
     const maxChars = showTime ? 16 : 10

     // ─── Oraliq cheklovlari (dan/gacha) ───
     const minDateObj = toDateObj(minDate)
     const maxDateObj = toDateObj(maxDate)
     // Berilgan sana ruxsat etilgan oraliqdami? (kun darajasida)
     const inRange = (d: Date | null) => {
          if (!d) return true
          if (minDateObj && dayjs(d).isBefore(dayjs(minDateObj), "day")) return false
          if (maxDateObj && dayjs(d).isAfter(dayjs(maxDateObj), "day")) return false
          return true
     }
     // Kalendarda o'chirib qo'yiladigan sanalar (react-day-picker matcher'lari)
     const disabledMatchers: any[] = []
     if (minDateObj) disabledMatchers.push({ before: minDateObj })
     if (maxDateObj) disabledMatchers.push({ after: maxDateObj })

     const formatDate = (selectedDate: Date | null) => {
          if (!selectedDate) return ""
          return dayjs(selectedDate).locale(currentLang).format(currentFormat)
     }

     const [inputValue, setInputValue] = useState(() => formatDate(toDateObj(value)))

     // Tashqi `value` o'zgarsa (masalan forma tozalanganda), ichki state'ni sinxronlaymiz
     useEffect(() => {
          if (value === undefined) return // controlled emas — e'tiborsiz qoldiramiz
          const next = toDateObj(value)
          setDate(next)
          if (next) setMonth(next)
     }, [value])

     useEffect(() => {
          setInputValue(formatDate(date))
     }, [currentLang, date])

     // Sanani yangilab, tashqariga ham xabar beradi
     const updateDate = (newDate: Date | null) => {
          setDate(newDate)
          onChange?.(newDate)
     }

     const displayLabel = label
     const displayPlaceholder = placeholder || (showTime ? "DD.MM.YYYY HH:mm" : "Sana tanlang")

     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          let val = e.target.value
          const isDeleting = val.length < inputValue.length

          val = val.replace(/\D/g, "")

          if (!isDeleting) {
               if (val.length > 2 && val.length <= 4) {
                    val = `${val.slice(0, 2)}.${val.slice(2)}`
               } else if (val.length > 4 && val.length <= 8) {
                    val = `${val.slice(0, 2)}.${val.slice(2, 4)}.${val.slice(4)}`
               } else if (showTime && val.length > 8 && val.length <= 10) {
                    val = `${val.slice(0, 2)}.${val.slice(2, 4)}.${val.slice(4, 8)} ${val.slice(8)}`
               } else if (showTime && val.length > 10) {
                    val = `${val.slice(0, 2)}.${val.slice(2, 4)}.${val.slice(4, 8)} ${val.slice(8, 10)}:${val.slice(10, 12)}`
               }
          } else {
               if (val.length > 2 && val.length <= 4) {
                    val = `${val.slice(0, 2)}.${val.slice(2)}`
               } else if (val.length > 4 && val.length <= 8) {
                    val = `${val.slice(0, 2)}.${val.slice(2, 4)}.${val.slice(4)}`
               } else if (showTime && val.length > 8 && val.length <= 10) {
                    val = `${val.slice(0, 2)}.${val.slice(2, 4)}.${val.slice(4, 8)} ${val.slice(8)}`
               } else if (showTime && val.length > 10) {
                    val = `${val.slice(0, 2)}.${val.slice(2, 4)}.${val.slice(4, 8)} ${val.slice(8, 10)}:${val.slice(10)}`
               }
          }

          setInputValue(val)

          if (val === "") {
               updateDate(null)
               return
          }

          if (val.length === maxChars) {
               const parsedDate = dayjs(val, currentFormat, true).toDate()
               // Oraliqdan tashqaridagi sanani qabul qilmaymiz (onBlur eski qiymatga qaytaradi)
               if (!isNaN(parsedDate.getTime()) && inRange(parsedDate)) {
                    updateDate(parsedDate)
                    setMonth(parsedDate)
               }
          }
     }

     return (
          <Field className={cn(widthClass, className)}>
               {displayLabel && <FieldLabel className={labelClassName} htmlFor={fieldId}>{displayLabel}</FieldLabel>}

               <div className={cn(
                    "relative flex items-center h-10 rounded-xl border transition-colors",
                    error ? "border-red-500" : "border-[#e5e5e5] dark:border-[#262626]",
                    "focus-within:border-[#0474F3]",
                    disabled && "opacity-50 cursor-not-allowed",
                    inputClassName
               )}>
                    <input
                         id={fieldId}
                         value={inputValue}
                         placeholder={displayPlaceholder}
                         maxLength={maxChars}
                         onChange={handleChange}
                         className="flex-1 h-full px-3.5 bg-transparent text-[13px] text-[#0a0a0a] dark:text-[#fafafa] placeholder:text-[#a3a3a3] dark:placeholder:text-[#525252] outline-none focus:ring-0"
                         onBlur={() => {
                              if (inputValue.length < maxChars || isNaN(dayjs(inputValue, currentFormat, true).toDate().getTime())) {
                                   setInputValue(formatDate(date))
                              }
                         }}
                         onKeyDown={(e) => {
                              if (e.key === "ArrowDown") {
                                   e.preventDefault()
                                   setOpen(true)
                              }
                         }}
                         disabled={disabled}
                         {...props}
                    />

                    <div className="flex items-center pr-2.5 gap-1 shrink-0">
                         {date && !disabled && (
                              <button
                                   type="button"
                                   tabIndex={-1}
                                   onClick={(e) => {
                                        e.stopPropagation()
                                        updateDate(null)
                                        setInputValue("")
                                   }}
                                   className="cursor-pointer flex items-center justify-center w-5 h-5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-[#a3a3a3] hover:text-[#737373] transition-colors"
                                   aria-label="Clear date"
                              >
                                   <XIcon className="size-3" />
                              </button>
                         )}

                         <Popover open={open} onOpenChange={setOpen}>
                              <PopoverTrigger
                                   render={
                                        <button
                                             id={`${fieldId}-trigger`}
                                             type="button"
                                             className="cursor-pointer disabled:cursor-default flex items-center justify-center w-5 h-5 rounded-md text-[#a3a3a3] hover:text-[#737373] hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                             aria-label="Select date"
                                             disabled={disabled}
                                        >
                                             {calendarIcon || <CalendarIcon className="size-4" />}
                                        </button>
                                   }
                              />

                              <PopoverContent
                                   className="w-auto overflow-hidden p-0"
                                   align="end"
                                   alignOffset={-8}
                                   sideOffset={10}
                              >
                                   <Calendar
                                        mode="single"
                                        captionLayout="dropdown"
                                        startMonth={new Date(new Date().getFullYear() - 5, 0)}
                                        endMonth={new Date(new Date().getFullYear() + 5, 11)}
                                        selected={date}
                                        month={month}
                                        onMonthChange={setMonth}
                                        disabled={disabledMatchers.length ? disabledMatchers : undefined}
                                        locale={calendarLocales[currentLang] || uz}
                                        onSelect={(selectedDate: Date | undefined) => {
                                             if (!selectedDate) return

                                             if (showTime) {
                                                  let baseDate = dayjs(selectedDate)
                                                  if (inputValue.length === 16) {
                                                       const timePart = inputValue.slice(11)
                                                       const [hours, minutes] = timePart.split(":")
                                                       baseDate = baseDate.hour(parseInt(hours)).minute(parseInt(minutes))
                                                  } else {
                                                       baseDate = baseDate.hour(dayjs().hour()).minute(dayjs().minute())
                                                  }
                                                  updateDate(baseDate.toDate())
                                             } else {
                                                  updateDate(selectedDate)
                                             }
                                             setOpen(false)
                                        }}
                                   />
                              </PopoverContent>
                         </Popover>
                    </div>
               </div>
               {errorText && <span className="text-xs text-red-500">{errorText}</span>}
          </Field>
     )
}
