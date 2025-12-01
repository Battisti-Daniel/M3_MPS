import toast from "react-hot-toast";
import { handleApiError } from "../handle-api-error";
import { errorHandler } from "../error-handler";

jest.mock("react-hot-toast");
jest.mock("../error-handler");

const mockedToast = toast as jest.Mocked<typeof toast>;
const mockedErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;

describe("handleApiError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedErrorHandler.handle.mockImplementation(() => {});
    mockedErrorHandler.getErrorMessage.mockReturnValue("Error message");
    mockedErrorHandler.isAuthError.mockReturnValue(false);
  });

  it("should call errorHandler.handle with error and context", () => {
    const error = new Error("Test error");

    handleApiError(error);

    expect(mockedErrorHandler.handle).toHaveBeenCalledWith(error, "API Error");
  });

  it("should show toast with error message", () => {
    const error = new Error("Test error");
    mockedErrorHandler.getErrorMessage.mockReturnValue("Custom error message");

    handleApiError(error);

    expect(mockedToast.error).toHaveBeenCalledWith("Custom error message");
  });

  it("should use fallback message when getErrorMessage returns empty", () => {
    const error = new Error("Test error");
    mockedErrorHandler.getErrorMessage.mockReturnValue("");

    handleApiError(error, "Fallback message");

    expect(mockedToast.error).toHaveBeenCalledWith("Fallback message");
  });

  it("should use default fallback message", () => {
    const error = new Error("Test error");
    mockedErrorHandler.getErrorMessage.mockReturnValue("");

    handleApiError(error);

    expect(mockedToast.error).toHaveBeenCalledWith("Ocorreu um erro inesperado.");
  });

  it("should not show toast for auth errors", () => {
    const error = new Error("Unauthorized");
    mockedErrorHandler.isAuthError.mockReturnValue(true);

    handleApiError(error);

    expect(mockedToast.error).not.toHaveBeenCalled();
  });

  it("should handle non-Error objects", () => {
    const error = { message: "Object error" };

    handleApiError(error);

    expect(mockedErrorHandler.handle).toHaveBeenCalledWith(error, "API Error");
  });

  it("should handle string errors", () => {
    const error = "String error";

    handleApiError(error);

    expect(mockedErrorHandler.handle).toHaveBeenCalledWith(error, "API Error");
  });

  it("should handle undefined error", () => {
    handleApiError(undefined);

    expect(mockedErrorHandler.handle).toHaveBeenCalledWith(undefined, "API Error");
  });

  it("should handle null error", () => {
    handleApiError(null);

    expect(mockedErrorHandler.handle).toHaveBeenCalledWith(null, "API Error");
  });

  it("should use empty string fallback if provided", () => {
    const error = new Error("Test");
    mockedErrorHandler.getErrorMessage.mockReturnValue("");

    handleApiError(error, "");

    expect(mockedToast.error).toHaveBeenCalledWith("");
  });
});
