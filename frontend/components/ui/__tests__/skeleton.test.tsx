import { render, screen } from "@testing-library/react";
import { Skeleton } from "../skeleton";

describe("Skeleton", () => {
  it("should render a div element", () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton").tagName).toBe("DIV");
  });

  it("should have aria-busy attribute", () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-busy", "true");
  });

  it("should have aria-label for accessibility", () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByLabelText("Carregando...")).toBeInTheDocument();
  });

  it("should apply base animation classes", () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("animate-shimmer");
    expect(skeleton).toHaveClass("rounded-md");
  });

  it("should apply custom className", () => {
    render(<Skeleton className="h-10 w-full" data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("h-10");
    expect(skeleton).toHaveClass("w-full");
  });

  it("should pass additional props", () => {
    render(<Skeleton data-testid="skeleton" id="my-skeleton" role="progressbar" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveAttribute("id", "my-skeleton");
    expect(skeleton).toHaveAttribute("role", "progressbar");
  });

  it("should have gradient background classes", () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("bg-gradient-to-r");
  });

  it("should have dark mode classes", () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton.className).toContain("dark:");
  });

  it("should allow style prop", () => {
    render(<Skeleton data-testid="skeleton" style={{ height: 100 }} />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveStyle({ height: "100px" });
  });

  it("should render multiple skeletons independently", () => {
    render(
      <>
        <Skeleton data-testid="skeleton-1" className="w-20" />
        <Skeleton data-testid="skeleton-2" className="w-40" />
      </>
    );
    expect(screen.getByTestId("skeleton-1")).toHaveClass("w-20");
    expect(screen.getByTestId("skeleton-2")).toHaveClass("w-40");
  });
});
