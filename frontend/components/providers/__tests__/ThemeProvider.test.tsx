import { render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "../ThemeProvider";

describe("ThemeProvider", () => {
  const originalLocalStorage = window.localStorage;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Remove dark class
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("should render children", async () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Child content</div>
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  it("should remove dark class when darkMode is not set", async () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  it("should set darkMode to false in localStorage if null", async () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(localStorage.getItem("darkMode")).toBe("false");
    });
  });

  it("should add dark class when darkMode is true", async () => {
    localStorage.setItem("darkMode", "true");
    
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  it("should remove dark class when darkMode is false", async () => {
    localStorage.setItem("darkMode", "false");
    document.documentElement.classList.add("dark");
    
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  it("should render children before mount", () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Content</div>
      </ThemeProvider>
    );
    
    // Children should be rendered even before mount state updates
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("should not add darkMode to localStorage if already set", async () => {
    localStorage.setItem("darkMode", "true");
    
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(localStorage.getItem("darkMode")).toBe("true");
    });
  });
});
