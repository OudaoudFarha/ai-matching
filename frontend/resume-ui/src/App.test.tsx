import { render, screen } from "@testing-library/react";
import App from "./App";
import { describe, it, expect } from "vitest";

describe("App", () => {
  it("renders login page", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
  });
});
