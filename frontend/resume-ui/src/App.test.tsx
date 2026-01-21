import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders login page", () => {
    render(<App />);

    // titre visible
    expect(
      screen.getByRole("heading", { name: /welcome back/i })
    ).toBeInTheDocument();

    // inputs via placeholder (pas besoin de label->for)
    expect(screen.getByPlaceholderText(/name@company\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();

    // bouton submit
    expect(
      screen.getByRole("button", { name: /se connecter/i })
    ).toBeInTheDocument();
  });
});
