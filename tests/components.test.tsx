// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Status, PortfolioView } from "../frontend/src/components";
import { demo } from "../shared/demo";
afterEach(cleanup);
describe("Interface", () => {
  it("annonce les erreurs et les confirmations", () => {
    render(
      <Status error="Enregistrement refusé" message="Profil sauvegardé" />,
    );
    expect(screen.getByRole("alert").textContent).toBe("Enregistrement refusé");
    expect(screen.getByRole("status").textContent).toBe("Profil sauvegardé");
  });
  it("présente les données et permet le téléchargement autorisé", () => {
    const click = vi.fn();
    render(<PortfolioView data={demo} onDownload={click} />);
    expect(
      screen.getByRole("heading", { name: "Mourad Sehboub" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Agora" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Télécharger mon CV" }));
    expect(click).toHaveBeenCalledOnce();
  });
  it("ne propose aucun téléchargement sans autorisation", () => {
    render(<PortfolioView data={demo} />);
    expect(
      screen.queryByRole("button", { name: "Télécharger mon CV" }),
    ).toBeNull();
  });
});
