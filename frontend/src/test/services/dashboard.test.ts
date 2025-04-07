import { describe, it, expect, vi, beforeEach } from "vitest";
import { dashboardService } from "../../services/api";
import { api } from "../../services/axios";

vi.mock("../../services/axios", () => ({
  api: {
    get: vi.fn(),
  },
}));

describe("dashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve buscar dados do dashboard com filtros", async () => {
    const mockResponse = {
      data: {
        energyData: [
          {
            electricityConsumption: 100,
            compensatedEnergy: 50,
            month: "2024-01-01T00:00:00.000Z",
            clientNumber: "123",
          },
        ],
        financialData: [
          {
            totalWithoutGD: 1000,
            gdSavings: 500,
            month: "2024-01-01T00:00:00.000Z",
            clientNumber: "123",
          },
        ],
        summary: {
          clientNumber: "123",
          totalElectricityConsumption: 100,
          totalCompensatedEnergy: 50,
          totalWithoutGD: 1000,
          totalGDSavings: 500,
          savingsPercentage: 50,
        },
      },
    };

    vi.mocked(api.get).mockResolvedValue(mockResponse);

    const filters = {
      clientNumber: "123",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
    };

    const result = await dashboardService.getDashboardData(filters);

    expect(api.get).toHaveBeenCalledWith("/dashboard", {
      params: {
        clientNumber: "123",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    });

    expect(result).toEqual(mockResponse.data);
  });

  it("deve buscar dados do dashboard sem filtros", async () => {
    const mockResponse = {
      data: {
        energyData: [],
        financialData: [],
        summary: {
          clientNumber: "Todos os clientes",
          totalElectricityConsumption: 0,
          totalCompensatedEnergy: 0,
          totalWithoutGD: 0,
          totalGDSavings: 0,
          savingsPercentage: 0,
        },
      },
    };

    vi.mocked(api.get).mockResolvedValue(mockResponse);

    const result = await dashboardService.getDashboardData();

    expect(api.get).toHaveBeenCalledWith("/dashboard", {
      params: {},
    });

    expect(result).toEqual(mockResponse.data);
  });

  it("deve lidar com erros na requisição", async () => {
    const error = new Error("Erro na requisição");
    vi.mocked(api.get).mockRejectedValue(error);

    await expect(dashboardService.getDashboardData()).rejects.toThrow(
      "Erro na requisição"
    );
  });
});
