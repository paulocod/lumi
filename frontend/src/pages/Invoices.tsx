import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, Upload, Calendar, MoreVertical, RefreshCw } from 'lucide-react';
import { invoiceService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UploadPopup } from '../components/UploadPopup';
import { Invoice } from '../types/invoice';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

const filterSchema = z.object({
  clientNumber: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FilterFormData = z.infer<typeof filterSchema>;

export default function Invoices() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { register, watch } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
  });

  const filters = watch();

  const { data: response, isLoading, error } = useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['invoices', filters, page, limit],
    queryFn: async () => {
      console.log('[Invoices] Buscando faturas com filtros:', { ...filters, page, limit });
      try {
        const data = await invoiceService.getInvoices({ ...filters, page, limit });
        console.log('[Invoices] Faturas recebidas:', data);
        return data;
      } catch (error) {
        console.error('[Invoices] Erro ao buscar faturas:', error);
        throw error;
      }
    },
  });

  const handleDownload = async (pdfUrl: string) => {
    window.open(pdfUrl, '_blank');
  };

  const handleRetry = async (invoiceId: string) => {
    try {
      await invoiceService.retryInvoice(invoiceId);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao retentar processamento da fatura:', error);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        setIsUploadPopupOpen(true);
        await invoiceService.uploadInvoice(file);
        setTimeout(() => {
          setIsUploading(false);
        }, 2000);
      } catch (error) {
        console.error('Erro ao fazer upload da fatura:', error);
        setIsUploading(false);
      }
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar faturas</h2>
        <p className="text-sm text-red-600">
          Ocorreu um erro ao carregar as faturas. Por favor, tente novamente mais tarde.
        </p>
      </div>
    );
  }

  const totalPages = response?.total ? Math.ceil(response.total / limit) : 0;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-lumi-gray-100 p-6">
        <h2 className="text-lg font-semibold text-lumi-gray-900 mb-4">Filtros</h2>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="clientNumber"
              className="block text-sm font-medium text-lumi-gray-700 mb-1"
            >
              Nº do Cliente
            </label>
            <input
              type="text"
              id="clientNumber"
              {...register('clientNumber')}
              className="w-full px-3 py-2 border border-lumi-gray-300 rounded-md shadow-sm placeholder-lumi-gray-400 focus:outline-none focus:ring-2 focus:ring-lumi-green-500 focus:border-lumi-green-500 text-sm"
              placeholder="Digite o número do cliente"
            />
          </div>
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-lumi-gray-700 mb-1"
            >
              Data Inicial
            </label>
            <div className="relative">
              <input
                type="date"
                id="startDate"
                {...register('startDate')}
                className="w-full px-3 py-2 border border-lumi-gray-300 rounded-md shadow-sm placeholder-lumi-gray-400 focus:outline-none focus:ring-2 focus:ring-lumi-green-500 focus:border-lumi-green-500 text-sm"
                placeholder="Selecione a data inicial"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-lumi-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-lumi-gray-700 mb-1"
            >
              Data Final
            </label>
            <div className="relative">
              <input
                type="date"
                id="endDate"
                {...register('endDate')}
                className="w-full px-3 py-2 border border-lumi-gray-300 rounded-md shadow-sm placeholder-lumi-gray-400 focus:outline-none focus:ring-2 focus:ring-lumi-green-500 focus:border-lumi-green-500 text-sm"
                placeholder="Selecione a data final"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-lumi-gray-400 pointer-events-none" />
            </div>
          </div>
        </form>
      </div>

      {/* Upload de Fatura - Apenas para ADMIN */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white rounded-xl shadow-sm border border-lumi-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-lumi-gray-900">
                Upload de Fatura
              </h2>
              <p className="mt-1 text-sm text-lumi-gray-500">
                Faça upload de novas faturas em formato PDF
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-lumi-green-600 hover:bg-lumi-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lumi-green-500 cursor-pointer transition-colors duration-200">
                <Upload className="h-5 w-5 mr-2" />
                Selecionar PDF
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleUpload}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Faturas */}
      <div className="bg-white rounded-xl shadow-sm border border-lumi-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-lumi-gray-200">
          <h2 className="text-lg font-semibold text-lumi-gray-900">
            Faturas Disponíveis
          </h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="px-6 py-4 text-center text-sm text-lumi-gray-500">
              Carregando faturas...
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-lumi-gray-200">
                <thead className="bg-lumi-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-lumi-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-lumi-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-lumi-gray-500 uppercase tracking-wider">
                      Consumo (kWh)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-lumi-gray-500 uppercase tracking-wider">
                      Compensada (kWh)
                    </th>
                    {user?.role === 'ADMIN' && (
                      <th className="px-6 py-3 text-center text-xs font-medium text-lumi-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    )}
                    <th className="px-6 py-3 text-center text-xs font-medium text-lumi-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-lumi-gray-200">
                  {response?.invoices?.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-lumi-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-lumi-gray-900 text-center">
                        {invoice.clientNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-lumi-gray-900 text-center">
                        {format(new Date(invoice.referenceMonth), 'MMMM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-lumi-gray-900 text-center">
                        {invoice.electricityQuantity.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-lumi-gray-900 text-center">
                        {invoice.compensatedEnergyQuantity.toLocaleString('pt-BR')}
                      </td>
                      {user?.role === 'ADMIN' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              invoice.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'ERROR'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {invoice.status === 'COMPLETED'
                              ? 'Concluído'
                              : invoice.status === 'ERROR'
                              ? 'Erro'
                              : 'Pendente'}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <div className="relative">
                          <button
                            onClick={() => setSelectedInvoice(selectedInvoice === invoice.id ? null : invoice.id)}
                            className="text-lumi-gray-400 hover:text-lumi-gray-600 focus:outline-none"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          {selectedInvoice === invoice.id && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1" role="menu">
                                {invoice.pdfUrl && (
                                  <button
                                    onClick={() => handleDownload(invoice.pdfUrl!)}
                                    className="w-full text-left px-4 py-2 text-sm text-lumi-gray-700 hover:bg-lumi-gray-100 flex items-center"
                                    role="menuitem"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </button>
                                )}
                                {user?.role === 'ADMIN' && (
                                  <button
                                    onClick={() => handleRetry(invoice.id!)}
                                    className="w-full text-left px-4 py-2 text-sm text-lumi-gray-700 hover:bg-lumi-gray-100 flex items-center"
                                    role="menuitem"
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Retentar
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && (!response?.invoices || response.invoices.length === 0) && (
                    <tr>
                      <td
                        colSpan={user?.role === 'ADMIN' ? 6 : 5}
                        className="px-6 py-4 text-center text-sm text-lumi-gray-500"
                      >
                        Nenhuma fatura encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-lumi-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-lumi-gray-300 text-sm font-medium rounded-md text-lumi-gray-700 bg-white hover:bg-lumi-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-lumi-gray-300 text-sm font-medium rounded-md text-lumi-gray-700 bg-white hover:bg-lumi-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próximo
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-lumi-gray-700">
                          Mostrando <span className="font-medium">{((page - 1) * limit) + 1}</span> a{' '}
                          <span className="font-medium">
                            {Math.min(page * limit, response?.total || 0)}
                          </span>{' '}
                          de <span className="font-medium">{response?.total || 0}</span> resultados
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-lumi-gray-300 bg-white text-sm font-medium text-lumi-gray-500 hover:bg-lumi-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Anterior
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                            <button
                              key={pageNumber}
                              onClick={() => setPage(pageNumber)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pageNumber === page
                                  ? 'z-10 bg-lumi-green-50 border-lumi-green-500 text-lumi-green-600'
                                  : 'bg-white border-lumi-gray-300 text-lumi-gray-500 hover:bg-lumi-gray-50'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          ))}
                          <button
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-lumi-gray-300 bg-white text-sm font-medium text-lumi-gray-500 hover:bg-lumi-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Próximo
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Popup de Upload */}
      <UploadPopup
        isOpen={isUploadPopupOpen}
        onClose={() => setIsUploadPopupOpen(false)}
        isUploading={isUploading}
      />
    </div>
  );
}
