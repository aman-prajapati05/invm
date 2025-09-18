
import { DownloadSimpleIcon, ExportIcon } from '@phosphor-icons/react/dist/ssr';
import React from 'react'

interface ImportBProps {
    // Define any props if needed
    onClick?: () => void;
}

const ImportB: React.FC<ImportBProps> = ({onClick}) => {
  return (
    <div onClick={onClick} className='w-fit flex gap-1 cursor-pointer items-center border-[#EAEAEA] rounded-lg border px-4 py-2 shadow-xs'>
      <div className='text-sm text-[#545659]'>Import</div>
      <DownloadSimpleIcon size={16} color='#545659' />
    </div>
  )
}

export default ImportB
