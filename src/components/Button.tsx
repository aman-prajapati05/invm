import React from 'react'

interface ButtonProps {
    text: string;
    onClick?: () => void;
    error:boolean;
    white?: boolean;
    disabled?: boolean;
}

const Button = ({text, onClick,error=false,white=false, disabled=false}: ButtonProps) => {
  return (
    <button 
    className={`px-4 py-2 text-sm rounded-lg  ${error ? 'bg-[#E50000] text-white' : white? 'bg-transparent border border-[#EAEAEA] text-[#545659]': 'bg-[#191A1B] text-white'} w-max cursor-pointer ${disabled ? 'bg-[#EAEAEA] text-[#90919B] shadow cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </button>
  )
}

export default Button
