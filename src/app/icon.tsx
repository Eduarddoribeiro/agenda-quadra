import { ImageResponse } from "next/og";
import { IconeApp } from "@/lib/icone-app";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<IconeApp tamanho={64} />, size);
}
