import type { User } from "@/types";

const d = (offsetDays: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString();
};

export const seedUsers: User[] = [
  {
    id: "u1",
    name: "Dr. Carlos Mendes",
    email: "carlos@vetdom.com",
    role: "vet",
    accountType: "clinic_user",
    clinicId: "c1",
    clinicName: "Clínica VetDom",
    active: true,
    createdAt: d(-180),
  },
  {
    id: "u2",
    name: "Dra. Ana Lima",
    email: "ana@vetdom.com",
    role: "vet",
    accountType: "clinic_user",
    clinicId: "c1",
    clinicName: "Clínica VetDom",
    active: true,
    createdAt: d(-150),
  },
  {
    id: "u3",
    name: "Fernanda Souza",
    email: "fernanda@vetdom.com",
    role: "attendant",
    accountType: "clinic_user",
    clinicId: "c1",
    clinicName: "Clínica VetDom",
    active: true,
    createdAt: d(-120),
  },
  {
    id: "u4",
    name: "Roberto Alves",
    email: "roberto@vetdom.com",
    role: "financial",
    accountType: "clinic_user",
    clinicId: "c1",
    clinicName: "Clínica VetDom",
    active: true,
    createdAt: d(-90),
  },
  {
    id: "u5",
    name: "Admin VetDom",
    email: "admin@vetdom.com",
    role: "admin",
    accountType: "clinic_owner",
    clinicId: "c1",
    clinicName: "Clínica VetDom",
    active: true,
    createdAt: d(-200),
  },
  {
    id: "u6",
    name: "Dr. João Autônomo",
    email: "joao@autonomo.com",
    role: "vet",
    accountType: "autonomous",
    active: true,
    createdAt: d(-60),
  },
];
