import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounce } from "../hooks/useDebounce";
import { X, AlertCircle } from "lucide-react";
import { filterSchema, FilterFormData } from "../schemas/filterSchema";

interface DateRangeFilterProps {
  onFilterChange: (filters: FilterFormData) => void;
  showClientNumber?: boolean;
  initialValues?: FilterFormData;
  immediateFilter?: boolean;
}

export function DateRangeFilter({
  onFilterChange,
  showClientNumber = true,
  initialValues = {},
  immediateFilter = false,
}: DateRangeFilterProps) {
  const form = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: initialValues,
  });

  const clientNumber = form.watch("clientNumber");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  const debouncedClientNumber = useDebounce(clientNumber, 300);

  const validateDates = React.useCallback(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        form.setError("endDate", {
          type: "manual",
          message: "Data final não pode ser menor que a data inicial",
        });
        return false;
      }
    }
    return true;
  }, [startDate, endDate, form]);

  const applyFilters = React.useCallback(() => {
    if (validateDates()) {
      const filters: FilterFormData = {};

      if (debouncedClientNumber) {
        filters.clientNumber = debouncedClientNumber;
      }

      if (startDate) {
        filters.startDate = startDate;
      }

      if (endDate) {
        filters.endDate = endDate;
      }

      onFilterChange(filters);
    }
  }, [
    debouncedClientNumber,
    startDate,
    endDate,
    onFilterChange,
    validateDates,
  ]);

  React.useEffect(() => {
    if (immediateFilter) {
      applyFilters();
    }
  }, [
    debouncedClientNumber,
    startDate,
    endDate,
    immediateFilter,
    applyFilters,
  ]);

  const onSubmit = React.useCallback(
    (data: FilterFormData) => {
      if (!immediateFilter) {
        onFilterChange(data);
      }
    },
    [onFilterChange, immediateFilter]
  );

  React.useEffect(() => {
    if (initialValues.clientNumber) {
      form.setValue("clientNumber", initialValues.clientNumber);
    }
    if (initialValues.startDate) {
      form.setValue("startDate", initialValues.startDate);
    }
    if (initialValues.endDate) {
      form.setValue("endDate", initialValues.endDate);
    }
  }, [initialValues, form]);

  const handleClearFilters = () => {
    form.reset({});
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-lumi-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-lumi-gray-900">Filtros</h2>
        <button
          type="button"
          onClick={handleClearFilters}
          className="inline-flex items-center px-3 py-1.5 border border-lumi-gray-300 text-sm font-medium rounded-md text-lumi-gray-700 bg-white hover:bg-lumi-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lumi-blue-500 transition-colors duration-200"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar filtros
        </button>
      </div>

      <form
        onChange={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {showClientNumber && (
          <div>
            <label
              htmlFor="clientNumber"
              className="block text-sm font-medium text-lumi-gray-700 mb-1"
            >
              Número do Cliente
            </label>
            <input
              type="text"
              id="clientNumber"
              {...form.register("clientNumber")}
              className="w-full px-3 py-2 border border-lumi-gray-300 rounded-md shadow-sm placeholder-lumi-gray-400 focus:outline-none focus:ring-2 focus:ring-lumi-green-500 focus:border-lumi-green-500 text-sm"
              placeholder="Digite o número do cliente"
            />
            {form.formState.errors.clientNumber && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {form.formState.errors.clientNumber.message}
              </p>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-lumi-gray-700 mb-1"
          >
            Data Inicial
          </label>
          <input
            type="month"
            id="startDate"
            {...form.register("startDate")}
            className="w-full px-3 py-2 border border-lumi-gray-300 rounded-md shadow-sm placeholder-lumi-gray-400 focus:outline-none focus:ring-2 focus:ring-lumi-green-500 focus:border-lumi-green-500 text-sm"
          />
          {form.formState.errors.startDate && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {form.formState.errors.startDate.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-lumi-gray-700 mb-1"
          >
            Data Final
          </label>
          <input
            type="month"
            id="endDate"
            {...form.register("endDate")}
            className="w-full px-3 py-2 border border-lumi-gray-300 rounded-md shadow-sm placeholder-lumi-gray-400 focus:outline-none focus:ring-2 focus:ring-lumi-green-500 focus:border-lumi-green-500 text-sm"
          />
          {form.formState.errors.endDate && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {form.formState.errors.endDate.message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
