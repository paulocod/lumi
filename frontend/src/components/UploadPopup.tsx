import { CheckCircle2, Loader2 } from 'lucide-react';

interface UploadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  isUploading: boolean;
}

export function UploadPopup({ isOpen, onClose, isUploading }: UploadPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          {isUploading ? (
            <>
              <Loader2 className="h-12 w-12 text-lumi-green-500 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-lumi-gray-900 mb-2">
                Processando arquivo
              </h3>
              <p className="text-sm text-lumi-gray-500">
                O arquivo está sendo processado e em breve aparecerá na lista de faturas.
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-12 w-12 text-lumi-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-lumi-gray-900 mb-2">
                Upload concluído
              </h3>
              <p className="text-sm text-lumi-gray-500">
                O arquivo foi enviado com sucesso e será processado em breve.
              </p>
            </>
          )}
          <button
            onClick={onClose}
            disabled={isUploading}
            className={`mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isUploading 
                ? 'bg-lumi-gray-400 cursor-not-allowed' 
                : 'bg-lumi-green-600 hover:bg-lumi-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lumi-green-500'
            }`}
          >
            {isUploading ? 'Processando...' : 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  );
}
