import { useModal } from '@/contexts/ModalContext';

export const useToast = () => {
  const { showToast } = useModal();
  
  return {
    showToast
  };
};
