"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Plus, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clientService } from "@/services/client.service";
import { petService } from "@/services/pet.service";
import { adaptApiClientToClient } from "@/adapters/client.adapter";
import { adaptApiPetToPet } from "@/adapters/pet.adapter";

const SP: Record<string, string> = {
  dog: "Cão",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Coelho",
  reptile: "Réptil",
  other: "Outro",
};

export default function PetsListPage() {
  const { id } = useParams<{ id: string }>();

  const { data: client } = useQuery({
    queryKey: ["clients", id],
    queryFn: () => clientService.get(id),
    select: adaptApiClientToClient,
    enabled: !!id,
  });

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ["pets", "client", id],
    queryFn: () => petService.byClient(id),
    select: (data) => data.map(adaptApiPetToPet),
    enabled: !!id,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/clientes/${id}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            {client?.name ?? "Cliente"}
          </p>
          <h1 className="text-xl font-bold leading-tight">Pets</h1>
        </div>
      </div>

      {/* Pet grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <PawPrint className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Nenhum pet cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique no botão <strong>+</strong> para adicionar o primeiro pet.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pets.map((pet) => (
            <Link key={pet.id} href={`/clientes/${id}/pets/${pet.id}`}>
              <div className="group relative rounded-xl border bg-card hover:shadow-md transition-shadow cursor-pointer overflow-hidden h-full">
                {/* Photo area */}
                <div className="h-36 bg-muted flex items-center justify-center">
                  <PawPrint className="w-12 h-12 text-muted-foreground/30" />
                </div>

                {/* Status badge */}
                {pet.status === "deceased" && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-gray-800 text-white text-xs">
                      Falecido
                    </Badge>
                  </div>
                )}

                {/* Info */}
                <div className="p-4 space-y-1">
                  <p className="font-semibold text-sm leading-tight truncate">{pet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {SP[pet.species] ?? pet.species}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                  </p>
                  {pet.weight != null && (
                    <p className="text-xs text-muted-foreground">{pet.weight} kg</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* FAB */}
      <Link href={`/clientes/${id}/pets/new`}>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  );
}
