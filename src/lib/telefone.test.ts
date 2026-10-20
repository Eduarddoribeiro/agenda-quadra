import { describe, expect, it } from "vitest";
import { formatarTelefone, normalizarTelefone, telefoneValido } from "./telefone";

describe("telefone", () => {
  it("normaliza celular com DDD para DDI 55", () => {
    expect(normalizarTelefone("(47) 99999-0000")).toBe("5547999990000");
    expect(normalizarTelefone("+55 47 99999-0000")).toBe("5547999990000");
  });

  it("valida tamanho", () => {
    expect(telefoneValido("47 99999-0000")).toBe(true);
    expect(telefoneValido("9999-0000")).toBe(false);
  });

  it("formata para exibição", () => {
    expect(formatarTelefone("5547999990000")).toBe("(47) 99999-0000");
    expect(formatarTelefone("554733330000")).toBe("(47) 3333-0000");
  });
});
