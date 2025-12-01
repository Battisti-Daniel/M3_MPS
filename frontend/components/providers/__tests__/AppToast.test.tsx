import { render } from "@testing-library/react";
import { AppToast } from "../AppToast";

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  Toaster: ({ position, toastOptions }: any) => (
    <div 
      data-testid="toaster" 
      data-position={position}
      data-success-bg={toastOptions?.success?.style?.background}
      data-error-bg={toastOptions?.error?.style?.background}
    />
  ),
}));

describe("AppToast", () => {
  it("should render Toaster component", () => {
    const { getByTestId } = render(<AppToast />);
    expect(getByTestId("toaster")).toBeInTheDocument();
  });

  it("should position toaster at top-right", () => {
    const { getByTestId } = render(<AppToast />);
    expect(getByTestId("toaster")).toHaveAttribute("data-position", "top-right");
  });

  it("should have green background for success toasts", () => {
    const { getByTestId } = render(<AppToast />);
    expect(getByTestId("toaster")).toHaveAttribute("data-success-bg", "#16a34a");
  });

  it("should have red background for error toasts", () => {
    const { getByTestId } = render(<AppToast />);
    expect(getByTestId("toaster")).toHaveAttribute("data-error-bg", "#dc2626");
  });
});
