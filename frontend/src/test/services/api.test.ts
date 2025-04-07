import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  invoiceService,
  dashboardService,
  authService,
} from "../../services/api";
import { api } from "../../services/axios";

vi.mock("../../services/axios", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("invoiceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve buscar faturas com filtros", async () => {
    const mockResponse = {
      data: {
        invoices: [{ id: "1", clientNumber: "123" }],
        total: 1,
      },
    };

    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const filters = {
      clientNumber: "123",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
      page: 1,
      limit: 10,
    };

    const result = await invoiceService.getInvoices(filters);

    expect(api.get).toHaveBeenCalledWith("/invoices", {
      params: {
        clientNumber: "123",
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-01-31T00:00:00.000Z",
        page: 1,
        limit: 10,
      },
    });

    expect(result).toEqual(mockResponse.data);
  });

  it("deve fazer upload de fatura", async () => {
    const mockFile = new File([""], "test.pdf", { type: "application/pdf" });
    const mockResponse = {
      data: {
        id: "1",
        status: "processing",
      },
    };

    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await invoiceService.uploadInvoice(mockFile);

    expect(api.post).toHaveBeenCalledWith(
      "/invoices/upload",
      expect.any(FormData),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    expect(result).toEqual(mockResponse.data);
  });
});

describe("dashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve buscar dados do dashboard", async () => {
    const mockResponse = {
      data: {
        energyData: [],
        financialData: [],
      },
    };

    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

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
});

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("deve fazer login e armazenar tokens", async () => {
    const mockResponse = {
      data: {
        access_token: "access123",
        refresh_token: "refresh123",
      },
    };

    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await authService.login("test@example.com", "password");

    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      email: "test@example.com",
      password: "password",
    });

    expect(localStorage.getItem("access_token")).toBe("access123");
    expect(localStorage.getItem("refresh_token")).toBe("refresh123");
    expect(result).toEqual(mockResponse.data);
  });

  it("deve fazer logout e remover tokens", () => {
    localStorage.setItem("access_token", "access123");
    localStorage.setItem("refresh_token", "refresh123");

    authService.logout();

    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
  });
});
