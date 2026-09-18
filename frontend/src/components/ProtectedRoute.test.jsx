import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

import ProtectedRoute from "./ProtectedRoute.jsx";

describe("ProtectedRoute", () => {
  it("redirects to /login when there is no user", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ProtectedRoute>
          <div>secret dashboard</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText("secret dashboard")).not.toBeInTheDocument();
  });
});
