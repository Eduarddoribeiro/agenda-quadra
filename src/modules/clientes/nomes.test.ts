import { describe, expect, it } from "vitest";
import { chaveDoNome } from "./nomes";

describe("chaveDoNome", () => {
  it("ignora acento, maiúscula e espaços a mais", () => {
    expect(chaveDoNome("  Escola de  VÔLEI ")).toBe(chaveDoNome("escola de volei"));
    expect(chaveDoNome("INTER")).toBe(chaveDoNome("Inter"));
  });

  it("nomes diferentes continuam diferentes", () => {
    expect(chaveDoNome("Inter")).not.toBe(chaveDoNome("Escolinha do Inter"));
  });
});
