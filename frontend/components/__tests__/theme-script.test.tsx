import { render } from "@testing-library/react";
import { ThemeScript } from "../theme-script";

describe("ThemeScript", () => {
  it("should render a script element", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script).toBeInTheDocument();
  });

  it("should have dangerouslySetInnerHTML", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toBeTruthy();
  });

  it("should contain localStorage check", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("localStorage");
  });

  it("should contain darkMode key check", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("darkMode");
  });

  it("should check for dark class", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("dark");
  });

  it("should handle classList add/remove", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("classList.add");
    expect(script?.innerHTML).toContain("classList.remove");
  });

  it("should wrap code in try/catch for safety", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("try");
    expect(script?.innerHTML).toContain("catch");
  });

  it("should be an IIFE (Immediately Invoked Function Expression)", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("(function()");
    expect(script?.innerHTML).toContain("})()");
  });

  it("should set darkMode to false if null", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("localStorage.setItem");
    expect(script?.innerHTML).toContain("'false'");
  });
});
