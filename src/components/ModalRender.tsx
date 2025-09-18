import SellBatchModal from './SellBatchModal';
import React from 'react'
import Logout from './Logout'
import SearchModal from './SearchModal'
import EditSku from './EditSku'
import UploadPoModal from './UploadPoModal'
import ImportModal from './ImportModal'
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import EditUser from './EditUser';
import DeactivateUser from './DeactivateUser';
import AddInvoice from './AddInvoice';
import AddManifest from './AddManifest';
import EditProduct from './EditProduct';
import AddBatch from './AddBatch';


interface ModalRenderProps {
  activeModal: string | null;
  closeModal: () => void;
  modalData?: any;
}

const ModalRender: React.FC<ModalRenderProps> = ({ activeModal, closeModal, modalData }) => {
  if (!activeModal) return null;
  const { logout } = useAuth();
  const { showToast } = useModal();
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal only if clicking on the backdrop (not on the modal content)
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleLogout = () => {
    logout();
    closeModal();
  };

  const renderModal = () => {
    switch (activeModal) {
      case 'units-sold':
        return (
          <SellBatchModal
            onClose={closeModal}
            onSave={modalData?.onSave || (() => {})}
            productId={modalData?.productId}
            batchId={modalData?.batchId}
            productName={modalData?.productName}
            batchCode={modalData?.batchCode}
            quantity={modalData?.quantity}
          />
        );
      case 'logout':
        return <Logout onLogout={handleLogout} onCancel={closeModal} />;
      case 'search':
        return <SearchModal onClose={closeModal} />;
      case 'add-product':
        return (
          <EditProduct
            mode="add"
            onClose={closeModal}
            onSave={modalData?.onSave || (() => {})}
          />
        );
      case 'edit-product':
        return (
          <EditProduct
            mode="edit"
            productData={modalData}
            onClose={closeModal}
            onSave={modalData?.onSave || (() => {})}
          />
        );
      case 'add-batch':
        return (
          <AddBatch
            onClose={closeModal}
            onSave={modalData?.onSave || (() => {})}
            {...modalData}
          />
        );
      case 'edit-batch':
        return (
          <AddBatch
            onClose={closeModal}
            onSave={modalData?.onSave || (() => {})}
            {...modalData}
          />
        );
        case 'edit-user':
        return (
          <EditUser
            mode="edit"
            userData={modalData}
            onClose={closeModal}
            onSave={modalData?.onSave || ((data) => {
              console.log('Editing user:', modalData?.id, data);
              // Handle edit user logic here
            })}
          />
        );
      case 'add-user':
        return (
          <EditUser
            mode="add"
            onClose={closeModal}
            onSave={modalData?.onSave || ((data) => {
              console.log('Adding user:', data);
              // Handle add user logic here
            })}
          />
            
        );
      case 'deactivate-user':
        return (
          <DeactivateUser
            userName={modalData?.name}
            onClose={closeModal}
            onDelete={modalData?.onDeactivate || (async () => {
              console.log('Deactivating user:', modalData?.id);
              // Handle deactivate user logic here
            })}
          />
        );
      case 'add-sku':
        return (
          <EditSku 
            mode="add" 
            onClose={closeModal} 
            onSave={modalData?.onSave || ((data) => {
              console.log('Adding SKU:', data);
              // Handle add SKU logic here
            })} 
          />
        );
      case 'edit-sku':
        return (
          <EditSku 
            mode="edit" 
            skuData={modalData}
            onClose={closeModal} 
            onSave={modalData?.onSave || ((data) => {
              console.log('Editing SKU:', modalData?._id, data);
              // Handle edit SKU logic here
            })} 
          />
        );
        case 'upload-po':
        return <UploadPoModal onClose={closeModal} onUploadSuccess={modalData?.onUploadSuccess} />;
      case 'import-sku':
        return <ImportModal onClose={closeModal} />;
        case 'add-invoice':
        return (
          <AddInvoice 
            onClose={closeModal} 
            labelId={modalData?.labelId}
            onInvoiceAdded={modalData?.onInvoiceAdded}
            mode={modalData?.invoiceNumber ? 'edit' : 'add'}
            currentInvoiceNumber={modalData?.invoiceNumber || ''}
          />
        );
      case 'add-manifest':
        return (
          <AddManifest 
            onClose={closeModal} 
            labelId={modalData?.labelId}
            onManifestAdded={modalData?.onManifestAdded}
            courier={modalData?.courier}
            isDocket={modalData?.isDocket}
            docketId={modalData?.docketId}
            awbNumber={modalData?.awbNumber}
            dispatchDate={modalData?.dispatchDate}
          />
        );
        case 'toast-demo':
        return (
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">Toast Demo</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  showToast('success', 'This is a success message!');
                  closeModal();
                }}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Success Toast
              </button>
              <button
                onClick={() => {
                  showToast('error', 'This is an error message!');
                  closeModal();
                }}
                className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Error Toast
              </button>
              <button
                onClick={() => {
                  showToast('warning', 'This is a warning message!');
                  closeModal();
                }}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Warning Toast
              </button>
              <button
                onClick={() => {
                  showToast('info', 'This is an info message!', 5000);
                  closeModal();
                }}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Info Toast (5s)
              </button>
            </div>
            <button
              onClick={closeModal}
              className="w-full mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        );
        default:
        return null;
    }
  };

  return (
    <div 
      className='fixed inset-0 bg-black/20 flex items-center justify-center z-50'
      onClick={handleBackdropClick}
    >
      {renderModal()}
    </div>
  )
}

export default ModalRender
