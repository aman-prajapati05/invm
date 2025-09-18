"use client"
import { CalendarDotsIcon, CaretDownIcon } from '@phosphor-icons/react/dist/ssr'
import React, { useState, useRef, useEffect } from 'react'
import DateRange from './DateRange'

interface DateButtonProps {
  onDateRangeSelect?: (startDate: Date | null, endDate: Date | null) => void
  selectedStartDate?: Date | null
  selectedEndDate?: Date | null
}

const DateButton: React.FC<DateButtonProps> = ({ 
  onDateRangeSelect,
  selectedStartDate,
  selectedEndDate 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleDateRangeChange = (startDate: Date | null, endDate: Date | null) => {
    // Update parent component immediately when dates change
    onDateRangeSelect?.(startDate, endDate)
  }

  const handleApply = (startDate: Date | null, endDate: Date | null) => {
    // Apply the selected date range and close dropdown
    onDateRangeSelect?.(startDate, endDate)
    setIsOpen(false)
  }

  const handleCancel = () => {
    // Clear the selected dates and notify parent
    onDateRangeSelect?.(null, null)
    setIsOpen(false)
  }

  // Format the display text based on selected dates
  const getDisplayText = () => {
    if (selectedStartDate && selectedEndDate) {
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      }
      
      if (selectedStartDate.toDateString() === selectedEndDate.toDateString()) {
        return formatDate(selectedStartDate)
      }
      
      return `${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`
    }
    return 'Select Date'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className='flex items-center cursor-pointer justify-center px-4 py-2 gap-2 bg-[#fff] rounded-lg border-[#EAEAEA] border hover:bg-gray-50 transition-colors'
      >
        <CalendarDotsIcon size={16} color='#545659' />
        <div className='text-[#545659] text-sm'>{getDisplayText()}</div>
        <CaretDownIcon 
          size={16} 
          color='#545659' 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {isOpen && (
        <div className="absolute top-full w-[55vw] right-0 mt-2 z-[10000]">
          <DateRange 
            onDateRangeChange={handleDateRangeChange}
            onApply={handleApply}
            onCancel={handleCancel}
            initialStartDate={selectedStartDate}
            initialEndDate={selectedEndDate}
          />
        </div>
      )}
    </div>
  )
}

export default DateButton
