import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardChart } from "../../components/DashboardChart";

vi.mock("chart.js", () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
}));

vi.mock("react-chartjs-2", () => ({
  Line: () => <div data-testid="mock-line-chart">Mock Line Chart</div>,
}));

describe("DashboardChart", () => {
  const mockEnergyData = [
    {
      date: "2024-01-01",
      consumption: 100,
      compensated: 50,
    },
    {
      date: "2024-02-01",
      consumption: 150,
      compensated: 75,
    },
  ];

  const mockFinancialData = [
    {
      date: "2024-01-01",
      totalWithoutGD: 1000,
      gdSavings: 500,
    },
    {
      date: "2024-02-01",
      totalWithoutGD: 1500,
      gdSavings: 750,
    },
  ];

  const mockEnergyLines = [
    {
      key: "consumption",
      name: "Consumo",
      color: "#10B981",
    },
    {
      key: "compensated",
      name: "Compensada",
      color: "#3B82F6",
    },
  ];

  const mockFinancialLines = [
    {
      key: "totalWithoutGD",
      name: "Total sem GD",
      color: "#EF4444",
    },
    {
      key: "gdSavings",
      name: "Economia GD",
      color: "#10B981",
    },
  ];

  it("deve renderizar o gráfico de energia corretamente", () => {
    render(
      <DashboardChart
        title="Consumo de Energia"
        data={mockEnergyData}
        lines={mockEnergyLines}
        yAxisLabel="kWh"
      />
    );

    expect(screen.getByText("Consumo de Energia")).toBeInTheDocument();
    expect(screen.getByTestId("mock-line-chart")).toBeInTheDocument();
  });

  it("deve renderizar o gráfico financeiro corretamente", () => {
    render(
      <DashboardChart
        title="Dados Financeiros"
        data={mockFinancialData}
        lines={mockFinancialLines}
        yAxisLabel="R$"
      />
    );

    expect(screen.getByText("Dados Financeiros")).toBeInTheDocument();
    expect(screen.getByTestId("mock-line-chart")).toBeInTheDocument();
  });

  it("deve renderizar com dados vazios", () => {
    render(
      <DashboardChart
        title="Gráfico Vazio"
        data={[]}
        lines={mockEnergyLines}
        yAxisLabel="kWh"
      />
    );

    expect(screen.getByText("Gráfico Vazio")).toBeInTheDocument();
    expect(screen.getByTestId("mock-line-chart")).toBeInTheDocument();
  });
});
