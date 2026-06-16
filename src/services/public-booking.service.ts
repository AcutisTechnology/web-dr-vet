import axios from "axios";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/+$/, "");

const publicClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

export interface BookingClinicInfo {
  clinic: { name: string; phone: string; city: string; state: string };
  services: string[];
  working_hours: Record<string, { enabled: boolean; start: string; end: string }>;
  slot_duration: number;
  customization: {
    headline: string | null;
    subtitle: string | null;
    welcome_message: string | null;
    primary_color: string | null;
    accent_color: string | null;
    logo_url: string | null;
    banner_url: string | null;
  };
}

export interface BookingSlot {
  start: string;
  end: string;
}

export interface BookingPayload {
  client_name: string;
  client_phone: string;
  client_email?: string;
  pet_name: string;
  pet_species: string;
  service_type: string;
  date: string;
  start_time: string;
}

export const publicBookingService = {
  getClinic: async (token: string): Promise<BookingClinicInfo> => {
    const { data } = await publicClient.get(`/public/booking/${token}`);
    return data;
  },

  getSlots: async (token: string, date: string): Promise<BookingSlot[]> => {
    const { data } = await publicClient.get(`/public/booking/${token}/slots/${date}`);
    return data.slots;
  },

  book: async (token: string, payload: BookingPayload) => {
    const { data } = await publicClient.post(`/public/booking/${token}/book`, payload);
    return data;
  },
};
