// Ícone do app: a quadra vista de cima (meio-campo e círculo central) em verde quadra.
// Usado pelo ImageResponse para gerar os PNGs do manifest e do iPhone.
export function IconeApp({ tamanho, margem = 0 }: { tamanho: number; margem?: number }) {
  const t = tamanho;
  const linha = Math.max(2, Math.round(t * 0.035));
  const cor = "rgba(255,255,255,0.92)";
  const interno = t - margem * 2;
  return (
    <div style={{ width: t, height: t, display: "flex", alignItems: "center", justifyContent: "center", background: "#0b7a41" }}>
      <div
        style={{
          position: "relative",
          width: interno * 0.72,
          height: interno * 0.72,
          display: "flex",
          border: `${linha}px solid ${cor}`,
          borderRadius: interno * 0.04,
        }}
      >
        {/* linha do meio */}
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: linha, marginLeft: -linha / 2, background: cor }} />
        {/* círculo central */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: interno * 0.3,
            height: interno * 0.3,
            marginLeft: -(interno * 0.15),
            marginTop: -(interno * 0.15),
            border: `${linha}px solid ${cor}`,
            borderRadius: "50%",
          }}
        />
        {/* bola no centro */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: interno * 0.1,
            height: interno * 0.1,
            marginLeft: -(interno * 0.05),
            marginTop: -(interno * 0.05),
            background: "#f2c200",
            borderRadius: "50%",
          }}
        />
      </div>
    </div>
  );
}
