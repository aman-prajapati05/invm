import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr'
import React from 'react'

interface SearchBoxProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ 
  searchText, 
  onSearchChange, 
  onSearch, 
  placeholder = "Search orders..." 
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className='p-2 bg-white rounded-lg flex items-center gap-1 border border-[#E0E0E0] shadow-xs w-80'>
      <MagnifyingGlassIcon 
        size={16} 
        color='#545659' 
        className="cursor-pointer" 
        onClick={onSearch}
      />
      <input
        type='text'
        placeholder={placeholder}
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className='text-[#545659] placeholder:text-[#545659] text-sm bg-transparent outline-none border-none focus:ring-0 focus:border-none w-full'
      />
    </div>
  )
}

export default SearchBox