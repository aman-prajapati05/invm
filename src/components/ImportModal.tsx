import { ExportIcon, XIcon } from '@phosphor-icons/react/dist/ssr'
import React from 'react'
import Button from './Button'

interface ImportModalProps {
  onClose: () => void;
}

const ImportModal = ({ onClose }: ImportModalProps) => {
  return (
      <div className='bg-white rounded-lg shadow-lg py-4 max-w-md w-full mx-4'>
        <div className='px-4 flex justify-between items-center border-b border-[#EAEAEA] pb-3'>
          <div className='text-lg font-medium text-[#313134]'>Import</div>
            <XIcon size={16} className='cursor-pointer' color='#313134' onClick={onClose} />
        </div>
        <div className='m-3 p-6 border-1 border-[#EAEAEA] flex flex-col justify-center items-center bg-[#FAFAFA] rounded-lg h-32'>
            <div className='w-6 h-6 flex justify-center items-center bg-[#EAEAEA] rounded mb-2'>
                <ExportIcon size={12} color='#545659' />
            </div>
            <div className='text-xs text-[#171717] font-medium text-center mb-1'>
                <span className='text-[#005BD3] cursor-pointer'>Upload a file</span> or drag and drop
            </div>
            <div className='text-[10px] text-[#90919B]'>
                CSV upto 5MB
            </div>
        </div>



        <div className='flex justify-end px-3 border-t pt-2 border-[#EAEAEA]'>
            <div className='flex gap-2'>
                <Button white={true} text='Cancel' onClick={onClose} error={false} />
                <Button white={false} text='Import' onClick={() => {}} error={false} disabled />
            </div>
        </div>
    </div>
  )
}

export default ImportModal
