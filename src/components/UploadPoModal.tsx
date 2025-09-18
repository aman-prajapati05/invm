"use client"
import { ExportIcon, XIcon, Trash, TrashIcon } from '@phosphor-icons/react/dist/ssr'
import React, { useState, useRef } from 'react'
import Button from './Button';
import { uploadPOPDFs } from '../lib/api/orders';
import { useToast } from '@/hooks/useToast'

interface UploadPoModalProps {
  onClose: () => void;
  onUploadSuccess?: () => void;
}

const UploadPoModal: React.FC<UploadPoModalProps> = ({ onClose, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    validateAndAddFiles(files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    validateAndAddFiles(files);
  };

  const validateAndAddFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                         file.type === 'text/csv';
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Only PDF, XLSX, and CSV files up to 5MB are allowed.');
    } else {
      setError(null);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // UploadPoModal.tsx — replace handleUpload with this version
const handleUpload = async () => {
  if (selectedFiles.length === 0) return;

  try {
    setUploading(true);
    setError(null);

    // Server returns: { results: [...], summary: { success, failed, message } }
    const { results = [], summary } = await uploadPOPDFs(selectedFiles);

    // Show per-file toasts
    let anySuccessOrWarning = false;

    results.forEach((r: any) => {
      const name = r.filename || 'File';
      const serverMsg = r?.toast?.description || r?.confirmation || r?.userError || '';
      const msg = serverMsg || `${name} processed.`;

      if (r.status === 'success') {
        toast.success(msg);
        anySuccessOrWarning = true;
      } else if (r.status === 'warning') {
        toast.warning(msg);
        anySuccessOrWarning = true;
      } else if (r.status === 'error') {
        toast.error(msg);
      } else {
        // Fallback
        toast.info(msg);
      }
    });

    // Batch summary toast
    if (summary?.message) {
      if (summary.failed > 0 && summary.success > 0) {
        toast.warning(summary.message);
      } else if (summary.failed > 0) {
        toast.error(summary.message);
      } else {
        toast.success(summary.message);
      }
    }

    // Refresh orders only if something succeeded or partially succeeded
    if (anySuccessOrWarning && onUploadSuccess) {
      await onUploadSuccess();
    }

    // Close modal after upload completes (keep behavior)
    onClose();
  } catch (err: any) {
    console.error('Upload failed:', err);
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      'Failed to upload files. Please try again.';
    setError(msg);
    toast.error(msg);
  } finally {
    setUploading(false);
  }
};


  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className='bg-white rounded-lg shadow-lg py-4 max-w-lg w-full mx-4'>
        <div className='px-4 flex justify-between items-center border-b border-[#EAEAEA] pb-3'>
          <div className='text-lg font-medium text-[#313134]'>Upload PO</div>
            <XIcon size={16} className='cursor-pointer' color='#313134' onClick={onClose} />
        </div>

        <div className='p-4'>
          <div 
            className='p-6  flex flex-col justify-center items-center bg-[#F5F5F5] rounded-lg h-32 cursor-pointer hover:bg-[#F0F0F0] transition-colors'
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className='w-6 h-6 flex justify-center items-center bg-[#EAEAEA] rounded mb-2'>
                <ExportIcon size={12} color='#545659' />
            </div>
            <div className='text-xs text-[#171717] font-medium text-center mb-1'>
                <span className='text-[#005BD3] cursor-pointer'>Upload files</span> or drag and drop
            </div>
            <div className='text-[10px] text-[#90919B]'>
                .PDF  upto 5MB each
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.xlsx,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className='mt-4'>
              {/* <div className='text-sm font-medium text-[#313134] mb-2'>
                Selected Files ({selectedFiles.length})
              </div> */}
              <div className='max-h-32 overflow-y-auto space-y-2'>
                {selectedFiles.map((file, index) => (
                  <div key={index} className='flex items-center justify-between bg-[#F5F5F5] gap-2 py-[6px] px-[10px] rounded-[6px] '>
                    <div className='w-8 h-8 bg-[#5090E3] rounded flex justify-center items-center text-white  text-[9px] font-bold'>pdf</div>
                    <div className='flex-1 min-w-0'>
                      <div className='text-xs font-medium text-[#191A1B] truncate'>{file.name}</div>
                      <div className='text-[10px] text-[#90919B]'>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className='py-1 px-[10px] cursor-pointer hover:bg-[#EAEAEA] rounded-[6px] text-xs text-[#545659] border-[#E3E3E3] border bg-[#fff] flex items-center justify-center'
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className='mt-3 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200'>
              {error}
            </div>
          )}
        </div>

        <div className='flex justify-end px-4 border-t border-[#EAEAEA] pt-3'>
            <div className='flex gap-2'>
                <Button white={true} text='Cancel' onClick={onClose} error={false} />
                <Button 
                  white={false} 
                  text={uploading ? 'Uploading...' : 'Upload'} 
                  onClick={handleUpload} 
                  error={false} 
                  disabled={selectedFiles.length === 0 || uploading}
                />
            </div>
        </div>
    </div>
  )
}

export default UploadPoModal
