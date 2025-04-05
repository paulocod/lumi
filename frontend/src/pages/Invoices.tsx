import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, Upload } from 'lucide-react';
import { invoiceService } from '../services/api';
import type { InvoiceFilters } from '../types/invoice';

const filterSchema = z.object({
  clientNumber: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FilterFormData = z.infer<typeof filterSchema>;

export default function Invoices() {
  const { register, watch } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
  });

  const filters = watch();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => invoiceService.getInvoices(filters as InvoiceFilters),
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

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="card">
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="clientNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Nº do Cliente
            </label>
            <input
              type="text"
              id="clientNumber"
              {...register('clientNumber')}
              className="input mt-1"
              placeholder="Digite o número do cliente"
            />
          </div>
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              Data Inicial
            </label>
            <input
              type="month"
              id="startDate"
              {...register('startDate')}
              className="input mt-1"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700"
            >
              Data Final
            </label>
            <input
              type="month"
              id="endDate"
              {...register('endDate')}
              className="input mt-1"
            />
          </div>
        </form>
      </div>

      {/* Upload de Fatura (Admin) */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Upload de Fatura
          </h3>
          <label className="btn btn-primary cursor-pointer">
            <Upload className="h-5 w-5 mr-2" />
            Upload PDF
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>

      {/* Lista de Faturas */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consumo (kWh)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compensado (kWh)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor sem GD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Economia GD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : invoices?.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Nenhuma fatura encontrada
                  </td>
                </tr>
              ) : (
                invoices?.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.clientNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.consumptionDate).toLocaleDateString(
                        'pt-BR'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.totalConsumption.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.compensatedEnergy.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {invoice.totalValueWithoutGD.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {invoice.gdSavings.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleDownload(invoice.pdfUrl)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
