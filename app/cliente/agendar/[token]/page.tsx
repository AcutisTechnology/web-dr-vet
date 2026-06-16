"use client";

import { use, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock4, Loader2, PawPrint, Phone, ShoppingBag, Stethoscope } from "lucide-react";
import {
  publicBookingService,
  type BookingLookupPet,
  type BookingSlot,
  type ClientBookingInfo,
  type ClientBookingItem,
} from "@/services/public-booking.service";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function speciesLabel(species: string) {
  const labels: Record<string, string> = {
    dog: "Cão",
    cat: "Gato",
    bird: "Ave",
    rabbit: "Coelho",
    reptile: "Réptil",
    other: "Outro",
  };
  return labels[species] ?? species;
}

export default function ClientPublicBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [info, setInfo] = useState<ClientBookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedItemKey, setSelectedItemKey] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    date: string;
    start_time: string;
    end_time: string;
    service_type: string;
    pet_name: string;
  } | null>(null);

  useEffect(() => {
    publicBookingService
      .getClientBooking(token)
      .then((data) => {
        setInfo(data);
        setSelectedPetId(data.pets[0]?.id ?? "");
        const firstItem = data.items[0];
        setSelectedItemKey(firstItem ? `${firstItem.type}:${firstItem.id}` : "");
      })
      .catch(() => setError("Este link de agendamento não está disponível."))
      .finally(() => setLoading(false));
  }, [token]);

  const selectedPet = useMemo<BookingLookupPet | null>(() => {
    return info?.pets.find((pet) => pet.id === selectedPetId) ?? null;
  }, [info?.pets, selectedPetId]);

  const selectedItem = useMemo<ClientBookingItem | null>(() => {
    if (!info || !selectedItemKey) return null;
    const [type, id] = selectedItemKey.split(":");
    return info.items.find((item) => item.type === type && item.id === id) ?? null;
  }, [info, selectedItemKey]);

  useEffect(() => {
    if (!selectedDate || !selectedItem) {
      setSlots([]);
      return;
    }

    setSlotsLoading(true);
    setSelectedSlot(null);
    publicBookingService
      .getClientSlots(token, selectedDate, { type: selectedItem.type, id: selectedItem.id })
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedItem, token]);

  const handleBook = async () => {
    if (!selectedPet || !selectedItem || !selectedSlot) return;
    setSubmitting(true);
    try {
      const result = await publicBookingService.bookClient(token, {
        pet_id: selectedPet.id,
        item_type: selectedItem.type,
        item_id: selectedItem.id,
        date: selectedDate,
        start_time: selectedSlot.start,
      });
      setConfirmation(result.appointment);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message ?? "Não foi possível confirmar o agendamento.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f7f8] flex items-center justify-center px-4 font-sans">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm border border-[#dbe5e7] text-[#24444a]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando agendamento
        </div>
      </main>
    );
  }

  if (error || !info) {
    return (
      <main className="min-h-screen bg-[#f4f7f8] flex items-center justify-center px-4 font-sans">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm border border-[#dbe5e7]">
          <PawPrint className="mx-auto h-9 w-9 text-[#1b6b74]" />
          <h1 className="mt-4 text-xl font-semibold text-[#17373d]">Link indisponível</h1>
          <p className="mt-2 text-sm text-[#667b80]">{error}</p>
        </div>
      </main>
    );
  }

  if (confirmation) {
    return (
      <main className="min-h-screen bg-[#f4f7f8] px-4 py-8 flex items-center justify-center font-sans">
        <section className="w-full max-w-xl rounded-[28px] bg-white p-7 shadow-sm border border-[#dbe5e7]">
          <CheckCircle2 className="h-12 w-12 text-[#1d8f74]" />
          <h1 className="mt-5 text-2xl font-semibold text-[#17373d]">Agendamento confirmado</h1>
          <div className="mt-5 rounded-2xl bg-[#edf6f3] p-4 text-sm text-[#24444a] space-y-1">
            <p><strong>Pet:</strong> {confirmation.pet_name}</p>
            <p><strong>Serviço:</strong> {confirmation.service_type}</p>
            <p><strong>Data:</strong> {new Date(`${confirmation.date}T00:00:00`).toLocaleDateString("pt-BR")}</p>
            <p><strong>Horário:</strong> {confirmation.start_time} às {confirmation.end_time}</p>
          </div>
          <p className="mt-5 text-sm text-[#667b80]">A clínica recebeu sua solicitação na agenda.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f8] px-4 py-6 sm:py-10 font-sans">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-[28px] bg-[#153f46] text-white p-6 sm:p-8 shadow-sm">
          <p className="text-sm text-white/70">Agendamento para {info.client.name}</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">{info.clinic.name}</h1>
              <p className="mt-2 text-sm text-white/75">
                Escolha o pet, o serviço ou produto e um horário disponível.
              </p>
            </div>
            {info.clinic.phone && (
              <a className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white" href={`tel:${info.clinic.phone}`}>
                <Phone className="h-4 w-4" />
                {info.clinic.phone}
              </a>
            )}
          </div>
        </header>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <div className="rounded-[24px] bg-white p-5 shadow-sm border border-[#dbe5e7]">
              <div className="flex items-center gap-2 text-[#17373d] font-semibold">
                <PawPrint className="h-5 w-5 text-[#1b6b74]" />
                Pet
              </div>
              {info.pets.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-[#fff7ed] p-4 text-sm text-[#9a5b12]">Nenhum pet ativo encontrado neste cliente. Fale com a clínica para cadastrar.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {info.pets.map((pet) => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => setSelectedPetId(pet.id)}
                      className={`rounded-2xl border p-4 text-left transition ${selectedPetId === pet.id ? "border-[#1b6b74] bg-[#edf6f3]" : "border-[#dbe5e7] hover:border-[#9db9be]"}`}
                    >
                      <p className="font-semibold text-[#17373d]">{pet.name}</p>
                      <p className="mt-1 text-sm text-[#667b80]">{speciesLabel(pet.species)}{pet.breed ? ` • ${pet.breed}` : ""}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[24px] bg-white p-5 shadow-sm border border-[#dbe5e7]">
              <div className="flex items-center gap-2 text-[#17373d] font-semibold">
                <Stethoscope className="h-5 w-5 text-[#1b6b74]" />
                Serviço ou produto
              </div>
              {info.items.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-[#fff7ed] p-4 text-sm text-[#9a5b12]">A clínica ainda não possui serviços ou produtos ativos no PDV.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {info.items.map((item) => {
                    const selected = selectedItemKey === `${item.type}:${item.id}`;
                    return (
                      <button
                        key={`${item.type}:${item.id}`}
                        type="button"
                        onClick={() => setSelectedItemKey(`${item.type}:${item.id}`)}
                        className={`rounded-2xl border p-4 text-left transition ${selected ? "border-[#1b6b74] bg-[#edf6f3]" : "border-[#dbe5e7] hover:border-[#9db9be]"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#17373d]">{item.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-wide text-[#667b80]">{item.type === "service" ? "Serviço" : "Produto"}{item.category ? ` • ${item.category}` : ""}</p>
                          </div>
                          {item.type === "product" ? <ShoppingBag className="h-4 w-4 text-[#1b6b74]" /> : <Stethoscope className="h-4 w-4 text-[#1b6b74]" />}
                        </div>
                        <p className="mt-3 text-sm font-semibold text-[#1b6b74]">{formatMoney(item.price)}</p>
                        {item.duration && <p className="mt-1 text-xs text-[#667b80]">{item.duration} min</p>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-[24px] bg-white p-5 shadow-sm border border-[#dbe5e7] h-fit lg:sticky lg:top-6">
            <div className="flex items-center gap-2 text-[#17373d] font-semibold">
              <CalendarDays className="h-5 w-5 text-[#1b6b74]" />
              Data e horário
            </div>

            <label className="mt-4 block text-sm font-medium text-[#24444a]" htmlFor="date">Data</label>
            <input
              id="date"
              type="date"
              min={todayIso()}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#dbe5e7] bg-white px-4 py-3 text-[#17373d] outline-none focus:border-[#1b6b74]"
            />

            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[#24444a]">
              <Clock4 className="h-4 w-4" />
              Horários disponíveis
            </div>
            {slotsLoading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-[#667b80]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando horários
              </div>
            ) : slots.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-[#f4f7f8] p-4 text-sm text-[#667b80]">Nenhum horário disponível para esta data.</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {slots.map((slot) => (
                  <button
                    key={`${slot.start}-${slot.end}`}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${selectedSlot?.start === slot.start ? "border-[#1b6b74] bg-[#153f46] text-white" : "border-[#dbe5e7] text-[#24444a] hover:border-[#9db9be]"}`}
                  >
                    {slot.start}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleBook}
              disabled={!selectedPet || !selectedItem || !selectedSlot || submitting}
              className="mt-6 w-full rounded-2xl bg-[#153f46] px-4 py-3 font-semibold text-white transition hover:bg-[#0f3238] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? "Confirmando..." : "Confirmar agendamento"}
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}
