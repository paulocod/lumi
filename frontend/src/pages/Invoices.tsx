import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, Upload, Calendar } from 'lucide-react';
import { invoiceService } from '../services/api';
import type { InvoiceFilters } from '../types/invoice';
import { useAuth } from '../hooks/useAuth';

const filterSchema = z.object({
  clientNumber: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FilterFormData = z.infer<typeof filterSchema>;

export default function Invoices() {
  const { isAuthenticated } = useAuth();
  console.log('[Invoices] Estado da autenticação:', { isAuthenticated });

  const { register, watch } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
  });

  const filters = watch();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      console.log('[Invoices] Buscando faturas com filtros:', filters);
      try {
        const data = await invoiceService.getInvoices(filters as InvoiceFilters);
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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await invoiceService.uploadInvoice(file);
        window.location.reload();
      } catch (error) {
        console.error('Erro ao fazer upload da fatura:', error);
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
                type="month"
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
                type="month"
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

      {/* Upload de Fatura */}
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
            <table className="min-w-full divide-y divide-lumi-gray-200">
              <thead className="bg-lumi-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-lumi-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-lumi-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-lumi-gray-500 uppercase tracking-wider">
                    Consumo (kWh)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-lumi-gray-500 uppercase tracking-wider">
                    Compensada (kWh)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-lumi-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-lumi-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-lumi-gray-200">
                {response?.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-lumi-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-lumi-gray-900">
                      {invoice.clientNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-lumi-gray-900">
                      {new Date(invoice.referenceMonth).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-lumi-gray-900">
                      {invoice.electricityQuantity.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-lumi-gray-900">
                      {invoice.compensatedEnergyQuantity.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {invoice.pdfUrl && (
                        <button
                          onClick={() => handleDownload(invoice.pdfUrl!)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-lumi-green-700 bg-lumi-green-50 hover:bg-lumi-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lumi-green-500 transition-colors duration-200"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Baixar PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoading && (!response || response.length === 0) && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-lumi-gray-500"
                    >
                      Nenhuma fatura encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
