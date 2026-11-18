export type BodyType = "platon" | "volteo" | "furgon" | "estacas";

export type Zone = {
  id: string;
  city_slug: string;
  city_name: string;
  name: string;
  lat: number;
  lng: number;
  sort_order: number;
};

export type PublicDriver = {
  id: string;
  slug: string;
  display_name: string;
  initials: string;
  body_type: BodyType;
  capacity_kg: number;
  schedule: string[];
  verified: boolean;
  city_slug: string;
  lat: number | null;
  lng: number | null;
  photo: string | null;
  rating_avg: number;
  review_count: number;
  jobs_count: number;
  is_sample: boolean;
  zone_ids: string[];
  latest_quote: string | null;
};

export type LastContact = {
  token: string;
  name: string;
  initials: string;
  at: number;
};

export const BODY_TYPES: { id: BodyType; label: string; hint: string }[] = [
  { id: "platon", label: "Platón", hint: "Abierto, carga general" },
  { id: "volteo", label: "Volteo", hint: "Escombros y materiales" },
  { id: "furgon", label: "Furgón", hint: "Cerrado, protege del clima" },
  { id: "estacas", label: "Estacas", hint: "Barandas altas" },
];

export const SCHEDULES = [
  { id: "semana", label: "Lunes a viernes" },
  { id: "sabado", label: "Sábados" },
  { id: "domingo", label: "Domingos y festivos" },
];

export const CAPACITIES = [
  { value: 500, label: "Hasta 500 kg" },
  { value: 800, label: "Hasta 800 kg" },
  { value: 1000, label: "Hasta 1.000 kg" },
  { value: 1200, label: "Más de 1.000 kg" },
];

export const LAST_CONTACT_COOKIE = "cg_last_contact";
