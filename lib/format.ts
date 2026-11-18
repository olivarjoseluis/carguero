import { BODY_TYPES, type BodyType } from "./types";

export const bodyLabel = (b: BodyType | string) =>
  BODY_TYPES.find((t) => t.id === b)?.label ?? b;

export const vehicleLabel = (b: BodyType | string) =>
  `Motocarro · ${bodyLabel(b).toLowerCase()}`;

export const formatKg = (kg: number) =>
  `${new Intl.NumberFormat("es-CO").format(kg)} kg`;

export const formatRating = (r: number) =>
  Number(r).toFixed(1).replace(".", ",");

export const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;
