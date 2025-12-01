import { renderHook, waitFor, act } from "@testing-library/react";
import { useAppointments } from "../useAppointments";
import { fetchAppointments } from "@/services/appointment-service";
import { handleApiError } from "@/lib/handle-api-error";

jest.mock("@/services/appointment-service");
jest.mock("@/lib/handle-api-error");

const mockedFetchAppointments = fetchAppointments as jest.MockedFunction<typeof fetchAppointments>;
const mockedHandleApiError = handleApiError as jest.MockedFunction<typeof handleApiError>;

describe("useAppointments", () => {
  const mockAppointments = [
    {
      id: 1,
      doctor_id: 1,
      patient_id: 1,
      date_time: "2024-01-15T10:00:00Z",
      status: "scheduled",
    },
    {
      id: 2,
      doctor_id: 2,
      patient_id: 2,
      date_time: "2024-01-16T14:00:00Z",
      status: "confirmed",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetchAppointments.mockResolvedValue({
      data: mockAppointments,
      total: 2,
      per_page: 20,
      current_page: 1,
      last_page: 1,
    });
  });

  it("should fetch appointments on mount when autoLoad is true", async () => {
    const { result } = renderHook(() => useAppointments());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.appointments).toEqual(mockAppointments);
    expect(mockedFetchAppointments).toHaveBeenCalledWith({
      per_page: 20,
      status: undefined,
      start_date: undefined,
      end_date: undefined,
    });
  });

  it("should not fetch appointments on mount when autoLoad is false", async () => {
    const { result } = renderHook(() => useAppointments({ autoLoad: false }));

    expect(result.current.loading).toBe(false);
    expect(result.current.appointments).toEqual([]);
    expect(mockedFetchAppointments).not.toHaveBeenCalled();
  });

  it("should use custom per_page option", async () => {
    renderHook(() => useAppointments({ per_page: 50 }));

    await waitFor(() => {
      expect(mockedFetchAppointments).toHaveBeenCalledWith(
        expect.objectContaining({ per_page: 50 })
      );
    });
  });

  it("should filter by status", async () => {
    renderHook(() => useAppointments({ status: "scheduled" }));

    await waitFor(() => {
      expect(mockedFetchAppointments).toHaveBeenCalledWith(
        expect.objectContaining({ status: "scheduled" })
      );
    });
  });

  it("should filter by date range", async () => {
    const start_date = "2024-01-01";
    const end_date = "2024-01-31";

    renderHook(() => useAppointments({ start_date, end_date }));

    await waitFor(() => {
      expect(mockedFetchAppointments).toHaveBeenCalledWith(
        expect.objectContaining({ start_date, end_date })
      );
    });
  });

  it("should handle API errors", async () => {
    const error = new Error("Network error");
    mockedFetchAppointments.mockRejectedValue(error);

    const { result } = renderHook(() => useAppointments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Network error");
    expect(mockedHandleApiError).toHaveBeenCalledWith(error, "Erro ao carregar consultas");
  });

  it("should handle non-Error objects in catch", async () => {
    mockedFetchAppointments.mockRejectedValue("string error");

    const { result } = renderHook(() => useAppointments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("string error");
  });

  it("should provide reload function", async () => {
    const { result } = renderHook(() => useAppointments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear mock to verify reload call
    mockedFetchAppointments.mockClear();

    act(() => {
      result.current.reload();
    });

    await waitFor(() => {
      expect(mockedFetchAppointments).toHaveBeenCalledTimes(1);
    });
  });

  it("should provide setAppointments function", async () => {
    const { result } = renderHook(() => useAppointments({ autoLoad: false }));

    const newAppointments = [
      {
        id: 3,
        doctor_id: 3,
        patient_id: 3,
        date_time: "2024-02-01T10:00:00Z",
        status: "scheduled",
      },
    ];

    act(() => {
      result.current.setAppointments(newAppointments as any);
    });

    expect(result.current.appointments).toEqual(newAppointments);
  });

  it("should handle empty data response", async () => {
    mockedFetchAppointments.mockResolvedValue({
      data: undefined,
      total: 0,
      per_page: 20,
      current_page: 1,
      last_page: 1,
    } as any);

    const { result } = renderHook(() => useAppointments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.appointments).toEqual([]);
  });

  it("should refetch when options change", async () => {
    const { result, rerender } = renderHook(
      (props: { status?: string }) => useAppointments({ status: props.status }),
      { initialProps: { status: "scheduled" } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedFetchAppointments).toHaveBeenCalledWith(
      expect.objectContaining({ status: "scheduled" })
    );

    mockedFetchAppointments.mockClear();

    rerender({ status: "completed" });

    await waitFor(() => {
      expect(mockedFetchAppointments).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed" })
      );
    });
  });

  it("should reset error on successful reload", async () => {
    const error = new Error("Initial error");
    mockedFetchAppointments.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useAppointments());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    mockedFetchAppointments.mockResolvedValueOnce({
      data: mockAppointments,
      total: 2,
      per_page: 20,
      current_page: 1,
      last_page: 1,
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.appointments).toEqual(mockAppointments);
  });

  it("should set loading to true during reload", async () => {
    const { result } = renderHook(() => useAppointments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loadingDuringReload = false;
    
    mockedFetchAppointments.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        loadingDuringReload = result.current.loading;
        setTimeout(() => {
          resolve({
            data: mockAppointments,
            total: 2,
            per_page: 20,
            current_page: 1,
            last_page: 1,
          });
        }, 10);
      });
    });

    act(() => {
      result.current.reload();
    });

    // Loading should be true immediately after reload
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("should combine multiple options", async () => {
    renderHook(() =>
      useAppointments({
        per_page: 10,
        status: "confirmed",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      })
    );

    await waitFor(() => {
      expect(mockedFetchAppointments).toHaveBeenCalledWith({
        per_page: 10,
        status: "confirmed",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      });
    });
  });

  it("should use default per_page of 20", async () => {
    renderHook(() => useAppointments());

    await waitFor(() => {
      expect(mockedFetchAppointments).toHaveBeenCalledWith(
        expect.objectContaining({ per_page: 20 })
      );
    });
  });
});
