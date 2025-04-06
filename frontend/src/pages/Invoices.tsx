import { useQuery } from '@tanstack/react-query';
import { Download, Upload, RefreshCw } from 'lucide-react';
import { invoiceService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UploadPopup } from '../components/UploadPopup';
import { Invoice } from '../types/invoice';
import { DateRangeFilter, FilterFormData } from '../components/DateRangeFilter';

// Adiciona o CSS para o efeito de ripple
const rippleStyle = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.7);
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;

interface PaginatedResponse<T> {
  invoices: T[];
  total: number;
}

export default function Invoices() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [filters, setFilters] = useState<FilterFormData>({});
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  const { data: response, isLoading, error } = useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['invoices', filters, page, limit],
    queryFn: async () => {
      console.log('[Invoices] Buscando faturas com filtros:', { ...filters, page, limit });
      try {
        // Se tiver clientNumber, busca todas as faturas e filtra no frontend
        if (filters.clientNumber) {
          const allData = await invoiceService.getInvoices({
            page,
            limit: 1000, // Busca mais itens para filtrar no frontend
            startDate: filters.startDate ? startOfMonth(new Date(filters.startDate)) : undefined,
            endDate: filters.endDate ? endOfMonth(new Date(filters.endDate)) : undefined,
          });
          
          // Filtra as faturas pelo número do cliente
          const filteredInvoices = allData.invoices.filter(invoice => 
            invoice.clientNumber.includes(filters.clientNumber!)
          );
          
          // Aplica paginação no frontend
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
          
          console.log('[Invoices] Faturas filtradas no frontend:', {
            total: filteredInvoices.length,
            page,
            limit,
            invoices: paginatedInvoices
          });
          
          return {
            invoices: paginatedInvoices,
            total: filteredInvoices.length
          };
        }
        
        // Caso contrário, busca as faturas filtradas do backend
        const data = await invoiceService.getInvoices({
          ...filters,
          page,
          limit,
          startDate: filters.startDate ? startOfMonth(new Date(filters.startDate)) : undefined,
          endDate: filters.endDate ? endOfMonth(new Date(filters.endDate)) : undefined,
        });
        console.log('[Invoices] Faturas recebidas do backend:', data);
        return data;
      } catch (error) {
        console.error('[Invoices] Erro ao buscar faturas:', error);
        throw error;
      }
    },
  });

  const handleDownload = async (pdfUrl: string, invoiceId: string) => {
    try {
      setLoadingActions(prev => ({ ...prev, [`download_${invoiceId}`]: true }));
      // Simula um pequeno atraso para mostrar o feedback visual
      await new Promise(resolve => setTimeout(resolve, 500));
      window.open(pdfUrl, '_blank');
    } finally {
      setLoadingActions(prev => ({ ...prev, [`download_${invoiceId}`]: false }));
    }
  };

  const handleRetry = async (invoiceId: string) => {
    try {
      setLoadingActions(prev => ({ ...prev, [`retry_${invoiceId}`]: true }));
      // Simula um pequeno atraso para mostrar o feedback visual
      await new Promise(resolve => setTimeout(resolve, 500));
      await invoiceService.reprocessInvoice(invoiceId);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao retentar processamento da fatura:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [`retry_${invoiceId}`]: false }));
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

  // Função para criar efeito de ripple
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
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
      {/* Adiciona o estilo de ripple */}
      <style>{rippleStyle}</style>
      
      {/* Filtros */}
      <DateRangeFilter 
        onFilterChange={setFilters}
        initialValues={filters}
        immediateFilter={true}
      />

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
                    <th className="px-6 py-3 text-center text-xs font-medium text-lumi-gray-500 uppercase tracking-wider">
                      Valor (R$)
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
                        {invoice.electricityQuantity.toLocaleString('pt-BR')} kWh
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-lumi-gray-900 text-center">
                        {invoice.compensatedEnergyQuantity.toLocaleString('pt-BR')} kWh
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-lumi-gray-900 text-center">
                        R$ {invoice.electricityValue.toLocaleString('pt-BR')}
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
                              ? 'Processado'
                              : invoice.status === 'ERROR'
                              ? 'Erro'
                              : 'Processando'}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {invoice.status === 'COMPLETED' && invoice.pdfUrl && (
                            <button
                              onClick={(e) => {
                                createRipple(e);
                                handleDownload(invoice.pdfUrl!, invoice.id);
                              }}
                              disabled={loadingActions[`download_${invoice.id}`]}
                              className={`p-2 rounded-full transition-all duration-200 relative overflow-hidden ${
                                loadingActions[`download_${invoice.id}`] 
                                  ? 'bg-lumi-blue-100 text-lumi-blue-800 animate-pulse cursor-not-allowed' 
                                  : 'text-lumi-blue-600 hover:bg-lumi-blue-100 hover:text-lumi-blue-800'
                              }`}
                              title={loadingActions[`download_${invoice.id}`] ? "Baixando..." : "Download PDF"}
                            >
                              <Download className="h-5 w-5" />
                            </button>
                          )}
                          {user?.role === 'ADMIN' && invoice.status === 'ERROR' && (
                            <button
                              onClick={(e) => {
                                createRipple(e);
                                handleRetry(invoice.id);
                              }}
                              disabled={loadingActions[`retry_${invoice.id}`]}
                              className={`p-2 rounded-full transition-all duration-200 relative overflow-hidden ${
                                loadingActions[`retry_${invoice.id}`] 
                                  ? 'bg-lumi-yellow-100 text-lumi-yellow-800 animate-spin cursor-not-allowed' 
                                  : 'text-lumi-yellow-600 hover:bg-lumi-yellow-100 hover:text-lumi-yellow-800'
                              }`}
                              title={loadingActions[`retry_${invoice.id}`] ? "Reprocessando..." : "Tentar novamente"}
                            >
                              <RefreshCw className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && (!response?.invoices || response.invoices.length === 0) && (
                    <tr>
                      <td
                        colSpan={user?.role === 'ADMIN' ? 7 : 6}
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
