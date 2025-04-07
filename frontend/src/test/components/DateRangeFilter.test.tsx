import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DateRangeFilter } from "../../components/DateRangeFilter";
import { FilterFormData } from "../../schemas/filterSchema";

describe("DateRangeFilter", () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar corretamente com valores padrão", () => {
    render(<DateRangeFilter onFilterChange={mockOnFilterChange} />);

    expect(screen.getByText("Filtros")).toBeInTheDocument();
    expect(screen.getByLabelText("Número do Cliente")).toBeInTheDocument();
    expect(screen.getByLabelText("Data Inicial")).toBeInTheDocument();
    expect(screen.getByLabelText("Data Final")).toBeInTheDocument();
    expect(screen.getByText("Limpar filtros")).toBeInTheDocument();
  });

  it("não deve mostrar o campo de número do cliente quando showClientNumber é false", () => {
    render(
      <DateRangeFilter
        onFilterChange={mockOnFilterChange}
        showClientNumber={false}
      />
    );

    expect(
      screen.queryByLabelText("Número do Cliente")
    ).not.toBeInTheDocument();
  });

  it("deve aplicar os filtros imediatamente quando immediateFilter é true", async () => {
    render(
      <DateRangeFilter
        onFilterChange={mockOnFilterChange}
        immediateFilter={true}
      />
    );

    const clientNumberInput = screen.getByLabelText("Número do Cliente");
    fireEvent.change(clientNumberInput, { target: { value: "123" } });

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        clientNumber: "123",
      });
    });
  });

  it("deve validar datas corretamente", async () => {
    render(<DateRangeFilter onFilterChange={mockOnFilterChange} />);

    const startDateInput = screen.getByLabelText("Data Inicial");
    const endDateInput = screen.getByLabelText("Data Final");

    fireEvent.change(startDateInput, { target: { value: "2024-02" } });
    fireEvent.change(endDateInput, { target: { value: "2024-01" } });

    await waitFor(() => {
      expect(
        screen.getByText("Data final não pode ser menor que a data inicial")
      ).toBeInTheDocument();
    });
  });

  it("deve limpar os filtros quando o botão de limpar é clicado", () => {
    const initialValues: FilterFormData = {
      clientNumber: "123",
      startDate: "2024-01",
      endDate: "2024-02",
    };

    render(
      <DateRangeFilter
        onFilterChange={mockOnFilterChange}
        initialValues={initialValues}
      />
    );

    const clearButton = screen.getByText("Limpar filtros");
    fireEvent.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });

  it("deve aplicar os valores iniciais corretamente", () => {
    const initialValues: FilterFormData = {
      clientNumber: "123",
      startDate: "2024-01",
      endDate: "2024-02",
    };

    render(
      <DateRangeFilter
        onFilterChange={mockOnFilterChange}
        initialValues={initialValues}
      />
    );

    expect(screen.getByLabelText("Número do Cliente")).toHaveValue("123");
    expect(screen.getByLabelText("Data Inicial")).toHaveValue("2024-01");
    expect(screen.getByLabelText("Data Final")).toHaveValue("2024-02");
  });
});
