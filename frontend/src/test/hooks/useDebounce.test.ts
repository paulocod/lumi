import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../../hooks/useDebounce";

describe("useDebounce", () => {
  it("deve retornar o valor inicial imediatamente", () => {
    const { result } = renderHook(() => useDebounce("valor inicial", 500));
    expect(result.current).toBe("valor inicial");
  });

  it("deve atualizar o valor após o delay", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "valor inicial", delay: 500 } }
    );

    expect(result.current).toBe("valor inicial");

    act(() => {
      rerender({ value: "novo valor", delay: 500 });
    });

    expect(result.current).toBe("valor inicial");

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe("novo valor");

    vi.useRealTimers();
  });

  it("deve limpar o timeout anterior quando o valor muda", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "valor inicial", delay: 500 } }
    );

    act(() => {
      rerender({ value: "valor intermediário", delay: 500 });
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    act(() => {
      rerender({ value: "valor final", delay: 500 });
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe("valor final");

    vi.useRealTimers();
  });
});
