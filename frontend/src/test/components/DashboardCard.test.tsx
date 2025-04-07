import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardCard } from "../../components/DashboardCard";
import { Zap } from "lucide-react";

describe("DashboardCard", () => {
  const defaultProps = {
    title: "Consumo de Energia",
    value: 1000,
    icon: <Zap />,
    description: "Total de energia consumida no período",
    formatValue: (value: number) => `${value} kWh`,
  };

  it("deve renderizar corretamente com valores padrão", () => {
    render(<DashboardCard {...defaultProps} />);

    expect(screen.getByText("Consumo de Energia")).toBeInTheDocument();
    expect(screen.getByText("1000 kWh")).toBeInTheDocument();
    expect(
      screen.getByText("Total de energia consumida no período")
    ).toBeInTheDocument();
  });

  it("deve exibir tendência positiva corretamente", () => {
    render(
      <DashboardCard
        {...defaultProps}
        trend={{
          value: 10,
          isPositive: true,
          label: "em relação ao mês anterior",
        }}
      />
    );

    expect(
      screen.getByText("+10% em relação ao mês anterior")
    ).toBeInTheDocument();
  });

  it("deve exibir tendência negativa corretamente", () => {
    render(
      <DashboardCard
        {...defaultProps}
        trend={{
          value: -15,
          isPositive: false,
          label: "em relação ao mês anterior",
        }}
      />
    );

    expect(
      screen.getByText("-15% em relação ao mês anterior")
    ).toBeInTheDocument();
  });

  it("deve exibir mensagem de dados insuficientes quando noData é true", () => {
    render(
      <DashboardCard
        {...defaultProps}
        trend={{
          value: 0,
          isPositive: false,
          label: "em relação ao mês anterior",
          noData: true,
        }}
      />
    );

    expect(
      screen.getByText("Dados insuficientes para comparação")
    ).toBeInTheDocument();
  });

  it("deve formatar o valor usando a função formatValue", () => {
    const customFormatValue = (value: number) => `R$ ${value.toFixed(2)}`;
    render(
      <DashboardCard
        {...defaultProps}
        value={1234.56}
        formatValue={customFormatValue}
      />
    );

    expect(screen.getByText("R$ 1234.56")).toBeInTheDocument();
  });

  it("deve exibir tendência neutra corretamente", () => {
    render(
      <DashboardCard
        {...defaultProps}
        trend={{
          value: 0,
          isPositive: false,
          label: "em relação ao mês anterior",
        }}
      />
    );

    expect(
      screen.getByText("0% em relação ao mês anterior")
    ).toBeInTheDocument();
  });
});
