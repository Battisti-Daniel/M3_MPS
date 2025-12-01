import { render, screen } from "@testing-library/react";
import { SkipLink } from "../skip-link";

describe("SkipLink", () => {
  it("should render a link element", () => {
    render(<SkipLink />);
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("should have correct text content", () => {
    render(<SkipLink />);
    expect(screen.getByText("Pular para o conteúdo principal")).toBeInTheDocument();
  });

  it("should link to #main-content", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("should have sr-only class for screen readers", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("sr-only");
  });

  it("should have focus styles", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("focus:not-sr-only");
    expect(link).toHaveClass("focus:absolute");
    expect(link).toHaveClass("focus:z-50");
  });

  it("should have background and text color on focus", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("focus:bg-blue-600");
    expect(link).toHaveClass("focus:text-white");
  });

  it("should have proper positioning on focus", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("focus:top-4");
    expect(link).toHaveClass("focus:left-4");
  });

  it("should have padding on focus", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("focus:px-4");
    expect(link).toHaveClass("focus:py-2");
  });

  it("should have rounded corners on focus", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("focus:rounded-md");
  });

  it("should have shadow on focus", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("focus:shadow-lg");
  });

  it("should have focus ring styles", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("focus:outline-none");
    expect(link).toHaveClass("focus:ring-2");
    expect(link).toHaveClass("focus:ring-blue-500");
    expect(link).toHaveClass("focus:ring-offset-2");
  });
});
