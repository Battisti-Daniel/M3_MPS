import { render, screen } from "@testing-library/react";
import { Label } from "../label";

describe("Label", () => {
  it("should render label with children", () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("should render as a label element", () => {
    render(<Label>Test</Label>);
    expect(screen.getByText("Test").tagName).toBe("LABEL");
  });

  it("should apply custom className", () => {
    render(<Label className="custom-class">Test</Label>);
    const label = screen.getByText("Test");
    expect(label).toHaveClass("custom-class");
  });

  it("should show asterisk when required is true", () => {
    render(<Label required>Required Field</Label>);
    expect(screen.getByLabelText("obrigatório")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("should not show asterisk when required is false", () => {
    render(<Label required={false}>Optional Field</Label>);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("should not show asterisk by default", () => {
    render(<Label>Default Field</Label>);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("should pass htmlFor prop", () => {
    render(<Label htmlFor="test-input">Test</Label>);
    const label = screen.getByText("Test");
    expect(label).toHaveAttribute("for", "test-input");
  });

  it("should apply typography styles", () => {
    render(<Label>Styled Label</Label>);
    const label = screen.getByText("Styled Label");
    expect(label).toHaveClass("font-semibold");
  });

  it("should have block display and margin", () => {
    render(<Label>Block Label</Label>);
    const label = screen.getByText("Block Label");
    expect(label).toHaveClass("block");
    expect(label).toHaveClass("mb-1.5");
  });

  it("should render with complex children", () => {
    render(
      <Label>
        <span data-testid="inner">Inner content</span>
      </Label>
    );
    expect(screen.getByTestId("inner")).toBeInTheDocument();
  });

  it("should handle additional props", () => {
    render(<Label data-testid="custom-label" id="my-label">Test</Label>);
    const label = screen.getByTestId("custom-label");
    expect(label).toHaveAttribute("id", "my-label");
  });
});
