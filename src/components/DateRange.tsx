"use client"

import { useState, useEffect } from "react"

interface DateRange {
  start: Date | null
  end: Date | null
}

interface DateRangeProps {
  onDateRangeChange?: (start: Date | null, end: Date | null) => void
  onApply?: (start: Date | null, end: Date | null) => void
  onCancel?: () => void
  initialStartDate?: Date | null
  initialEndDate?: Date | null
}

const PRESET_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "last7days" },
  { label: "Last 30 days", value: "last30days" },
  { label: "Last 90 days", value: "last90days" },
  { label: "Last month", value: "lastmonth" },
  { label: "Last 12 months", value: "last12months" },
  { label: "Last year", value: "lastyear" },
  { label: "Custom", value: "custom" },
]

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sat", "Su"]

export default function Component({ onDateRangeChange, onApply, onCancel, initialStartDate, initialEndDate }: DateRangeProps) {
  const [selectedPreset, setSelectedPreset] = useState("custom")
  const [dateRange, setDateRange] = useState<DateRange>({
    start: initialStartDate || null,
    end: initialEndDate || null,
  })
  // Track original values for cancel functionality
  const [originalDateRange, setOriginalDateRange] = useState<DateRange>({
    start: initialStartDate || null,
    end: initialEndDate || null,
  })
  const [currentMonth1, setCurrentMonth1] = useState(new Date()) // Start with current date
  const [currentMonth2, setCurrentMonth2] = useState(() => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth
  })
  const [isSelectingRange, setIsSelectingRange] = useState(false)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const [startDateInput, setStartDateInput] = useState("")
  const [endDateInput, setEndDateInput] = useState("")

  // Update calendar view when dateRange changes
  const updateCalendarView = (start: Date | null, end: Date | null) => {
    if (start) {
      setCurrentMonth1(new Date(start.getFullYear(), start.getMonth(), 1))
      const nextMonth = new Date(start.getFullYear(), start.getMonth() + 1, 1)
      setCurrentMonth2(nextMonth)
    } else {
      // Default to current month if no date selected
      const today = new Date()
      setCurrentMonth1(new Date(today.getFullYear(), today.getMonth(), 1))
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      setCurrentMonth2(nextMonth)
    }
  }

  // Initialize component on mount
  useEffect(() => {
    // Set initial values if provided
    if (initialStartDate || initialEndDate) {
      const newDateRange = {
        start: initialStartDate || null,
        end: initialEndDate || null,
      }
      setDateRange(newDateRange)
      setOriginalDateRange(newDateRange)
      updateCalendarView(newDateRange.start, newDateRange.end)
      setStartDateInput(newDateRange.start ? formatDate(newDateRange.start) : "")
      setEndDateInput(newDateRange.end ? formatDate(newDateRange.end) : "")
      
      // Determine if this matches a preset
      if (initialStartDate && initialEndDate) {
        const preset = getPresetForDates(initialStartDate, initialEndDate)
        setSelectedPreset(preset)
      }
    } else {
      updateCalendarView(dateRange.start, dateRange.end)
      setStartDateInput(dateRange.start ? formatDate(dateRange.start) : "")
      setEndDateInput(dateRange.end ? formatDate(dateRange.end) : "")
    }
  }, [initialStartDate, initialEndDate]) // Re-run when initial dates change

  // Function to determine preset based on dates
  const getPresetForDates = (start: Date, end: Date): string => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Normalize times for comparison (set to midnight)
    const normalizeDate = (date: Date) => {
      const normalized = new Date(date)
      normalized.setHours(0, 0, 0, 0)
      return normalized
    }
    
    const normalizedStart = normalizeDate(start)
    const normalizedEnd = normalizeDate(end)
    const normalizedToday = normalizeDate(today)
    const normalizedYesterday = normalizeDate(yesterday)
    
    // Check for Today
    if (normalizedStart.getTime() === normalizedToday.getTime() && 
        normalizedEnd.getTime() === normalizedToday.getTime()) {
      return "today"
    }
    
    // Check for Yesterday
    if (normalizedStart.getTime() === normalizedYesterday.getTime() && 
        normalizedEnd.getTime() === normalizedYesterday.getTime()) {
      return "yesterday"
    }
    
    // Check for Last 7 days
    const last7Start = new Date(today)
    last7Start.setDate(last7Start.getDate() - 6)
    const normalizedLast7Start = normalizeDate(last7Start)
    if (normalizedStart.getTime() === normalizedLast7Start.getTime() && 
        normalizedEnd.getTime() === normalizedToday.getTime()) {
      return "last7days"
    }
    
    // Check for Last 30 days
    const last30Start = new Date(today)
    last30Start.setDate(last30Start.getDate() - 29)
    const normalizedLast30Start = normalizeDate(last30Start)
    if (normalizedStart.getTime() === normalizedLast30Start.getTime() && 
        normalizedEnd.getTime() === normalizedToday.getTime()) {
      return "last30days"
    }
    
    // Check for Last 90 days
    const last90Start = new Date(today)
    last90Start.setDate(last90Start.getDate() - 89)
    const normalizedLast90Start = normalizeDate(last90Start)
    if (normalizedStart.getTime() === normalizedLast90Start.getTime() && 
        normalizedEnd.getTime() === normalizedToday.getTime()) {
      return "last90days"
    }
    
    // Check for Last month
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    const normalizedLastMonthStart = normalizeDate(lastMonthStart)
    const normalizedLastMonthEnd = normalizeDate(lastMonthEnd)
    if (normalizedStart.getTime() === normalizedLastMonthStart.getTime() && 
        normalizedEnd.getTime() === normalizedLastMonthEnd.getTime()) {
      return "lastmonth"
    }
    
    // Check for Last 12 months
    const last12Start = new Date(today)
    last12Start.setMonth(last12Start.getMonth() - 12)
    const normalizedLast12Start = normalizeDate(last12Start)
    if (normalizedStart.getTime() === normalizedLast12Start.getTime() && 
        normalizedEnd.getTime() === normalizedToday.getTime()) {
      return "last12months"
    }
    
    // Check for Last year
    const lastYearStart = new Date(today.getFullYear() - 1, 0, 1)
    const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31)
    const normalizedLastYearStart = normalizeDate(lastYearStart)
    const normalizedLastYearEnd = normalizeDate(lastYearEnd)
    if (normalizedStart.getTime() === normalizedLastYearStart.getTime() && 
        normalizedEnd.getTime() === normalizedLastYearEnd.getTime()) {
      return "lastyear"
    }
    
    return "custom"
  }

  // Function to handle preset date ranges
  const handlePresetSelection = (preset: string) => {
    setSelectedPreset(preset)
    
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let start: Date | null = null
    let end: Date | null = null
    
    switch (preset) {
      case 'today':
        start = end = today
        break
      case 'yesterday':
        start = end = yesterday
        break
      case 'last7days':
        start = new Date(today)
        start.setDate(start.getDate() - 6)
        end = today
        break
      case 'last30days':
        start = new Date(today)
        start.setDate(start.getDate() - 29)
        end = today
        break
      case 'last90days':
        start = new Date(today)
        start.setDate(start.getDate() - 89)
        end = today
        break
      case 'lastmonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        end = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case 'last12months':
        start = new Date(today)
        start.setMonth(start.getMonth() - 12)
        end = today
        break
      case 'lastyear':
        start = new Date(today.getFullYear() - 1, 0, 1)
        end = new Date(today.getFullYear() - 1, 11, 31)
        break
      case 'custom':
        // Keep current selection for custom
        return
      default:
        return
    }
    
    setDateRange({ start, end })
    setIsSelectingRange(false)
    // Remove immediate callback - only apply when Apply button is clicked
    updateCalendarView(start, end)
    setStartDateInput(start ? formatDate(start) : "")
    setEndDateInput(end ? formatDate(end) : "")
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    // Convert to Monday = 0, Sunday = 6
    let startDay = firstDay.getDay()
    startDay = startDay === 0 ? 6 : startDay - 1

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ""
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const parseDate = (dateString: string): Date | null => {
    if (!dateString.trim()) return null
    
    // Try to parse various date formats
    const formats = [
      // MM/DD/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // MM-DD-YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      // YYYY-MM-DD
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      // DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    ]
    
    // Try parsing with Date constructor first
    const parsedDate = new Date(dateString)
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate
    }
    
    // Try manual parsing with regex
    for (const format of formats) {
      const match = dateString.match(format)
      if (match) {
        let year, month, day
        if (format.source.startsWith('^(\\d{4})')) {
          // YYYY-MM-DD format
          [, year, month, day] = match
        } else {
          // MM/DD/YYYY or DD/MM/YYYY format
          [, month, day, year] = match
        }
        
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        if (!isNaN(date.getTime())) {
          return date
        }
      }
    }
    
    return null
  }

  const handleStartDateInputChange = (value: string) => {
    setStartDateInput(value)
    const parsedDate = parseDate(value)
    if (parsedDate) {
      setDateRange(prev => ({ ...prev, start: parsedDate }))
      setSelectedPreset("custom")
      updateCalendarView(parsedDate, dateRange.end)
    }
  }

  const handleEndDateInputChange = (value: string) => {
    setEndDateInput(value)
    const parsedDate = parseDate(value)
    if (parsedDate) {
      setDateRange(prev => ({ ...prev, end: parsedDate }))
      setSelectedPreset("custom")
      updateCalendarView(dateRange.start, parsedDate)
    }
  }

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false
    return date1.toDateString() === date2.toDateString()
  }

  const isInRange = (date: Date, start: Date | null, end: Date | null) => {
    if (!start || !end) return false
    return date >= start && date <= end
  }

  const isInHoverRange = (date: Date) => {
    if (!dateRange.start || !hoverDate) return false
    const start = dateRange.start
    const end = hoverDate
    const dateTime = date.getTime();
    return dateTime >= Math.min(start.getTime(), end.getTime()) && dateTime <= Math.max(start.getTime(), end.getTime());
  }

  const handleDateClick = (date: Date) => {
    if (!isSelectingRange) {
      setDateRange({ start: date, end: null })
      setIsSelectingRange(true)
      setSelectedPreset("custom")
      setStartDateInput(formatDate(date))
      setEndDateInput("")
    } else {
      if (dateRange.start && date >= dateRange.start) {
        setDateRange({ start: dateRange.start, end: date })
        setEndDateInput(formatDate(date))
        // Remove immediate callback - only apply when Apply button is clicked
      } else {
        setDateRange({ start: date, end: dateRange.start })
        setStartDateInput(formatDate(date))
        setEndDateInput(formatDate(dateRange.start))
        // Remove immediate callback - only apply when Apply button is clicked
      }
      setIsSelectingRange(false)
      setHoverDate(null)
    }
  }

  const handleDateHover = (date: Date) => {
    if (isSelectingRange && dateRange.start) {
      setHoverDate(date)
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentMonth1(new Date(currentMonth1.getFullYear(), currentMonth1.getMonth() - 1, 1))
      setCurrentMonth2(new Date(currentMonth2.getFullYear(), currentMonth2.getMonth() - 1, 1))
    } else {
      setCurrentMonth1(new Date(currentMonth1.getFullYear(), currentMonth1.getMonth() + 1, 1))
      setCurrentMonth2(new Date(currentMonth2.getFullYear(), currentMonth2.getMonth() + 1, 1))
    }
  }

  const renderCalendar = (currentMonth: Date) => {
    const days = getDaysInMonth(currentMonth)

    return (
      <div className="flex-1 ">
        <div className="text-center font-medium mb-4" style={{ color: '#545659' }}>
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="text-center text-sm font-medium p-2" style={{ color: '#545659' }}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="p-2"></div>
            }

            const isStart = isSameDay(date, dateRange.start)
            const isEnd = isSameDay(date, dateRange.end)
            const inRange = isInRange(date, dateRange.start, dateRange.end)
            const inHoverRange = isSelectingRange && isInHoverRange(date)

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => handleDateHover(date)}
                className={`
                  p-2 text-sm rounded-full hover:bg-gray-100 transition-colors
                  ${isStart || isEnd ? "bg-black text-white hover:bg-black" : ""}
                  ${inRange && !isStart && !isEnd ? "bg-gray-100" : ""}
                  ${inHoverRange && !isStart && !isEnd ? "bg-gray-50" : ""}
                `}
                style={{ 
                  color: isStart || isEnd ? 'white' : '#545659'
                }}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-full max-w-4xl z-[10000000] ">
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-40 border-r border-gray-200 pr-4">
          <div className="space-y-1">
            {PRESET_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePresetSelection(option.value)}
                className={`
                  w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors
                  ${selectedPreset === option.value ? "bg-gray-100" : ""}
                `}
                style={{ color: '#191A1B' }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Section */}
        <div className="flex-1">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigateMonth("prev")} className="p-1 hover:bg-gray-100 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button onClick={() => navigateMonth("next")} className="p-1 hover:bg-gray-100 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Dual Calendar */}
          <div className="flex gap-8 mb-6">
            {renderCalendar(currentMonth1)}
            {renderCalendar(currentMonth2)}
          </div>

          {/* Custom Date Range Inputs */}
          <div className="flex items-center gap-4 mb-6">
            <input
              type="text"
              value={startDateInput}
              onChange={(e) => handleStartDateInputChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Start date (MM/DD/YYYY)"
            />
            <span className="text-gray-500">—</span>
            <input
              type="text"
              value={endDateInput}
              onChange={(e) => handleEndDateInputChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="End date (MM/DD/YYYY)"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => {
                // Clear all selections when cancel is clicked
                const clearedRange = { start: null, end: null }
                setDateRange(clearedRange)
                setOriginalDateRange(clearedRange)
                setStartDateInput("")
                setEndDateInput("")
                updateCalendarView(null, null)
                setSelectedPreset("custom")
                setIsSelectingRange(false)
                setHoverDate(null)
                onCancel?.()
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                // Update original values to current selection
                setOriginalDateRange(dateRange)
                onApply?.(dateRange.start, dateRange.end)
              }}
              disabled={!dateRange.start || !dateRange.end}
              className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
