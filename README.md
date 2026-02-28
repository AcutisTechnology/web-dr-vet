# VetDom – Sistema de Gestão Veterinária

Frontend completo para clínica veterinária / pet shop, construído com Next.js 14+, TypeScript, TailwindCSS e shadcn/ui. Toda a "API" é simulada em memória — não há backend real.

## Tecnologias

- **Next.js 16** (App Router, Turbopack)
- **TypeScript** com path aliases (`@/...` → `src/`)
- **TailwindCSS v4** + **shadcn/ui** (componentes Radix UI)
- **Zustand** – gerenciamento de estado (sessão, carrinho, filtros)
- **React Hook Form + Zod** – formulários e validação
- **Recharts** – gráficos no Dashboard
- **Lucide React** – ícones

## Instalação e execução

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). A raiz redireciona para `/dashboard`.

## Login (fake)

Qualquer usuário do seed pode fazer login com **qualquer senha**.

| Nome          | E-mail            | Perfil       |
| ------------- | ----------------- | ------------ |
| Admin VetDom  | admin@vetdom.com  | admin        |
| Dra. Ana Lima | ana@vetdom.com    | vet          |
| Carlos Recep. | carlos@vetdom.com | receptionist |

A sessão é salva no `localStorage` e persiste entre recarregamentos.

## Mapa de rotas

| Rota             | Módulo                                  |
| ---------------- | --------------------------------------- |
| `/login`         | Tela de login                           |
| `/dashboard`     | KPIs, gráficos, alertas                 |
| `/agenda`        | Agendamentos (visão dia/semana)         |
| `/clientes`      | Lista de clientes e pets                |
| `/clientes/[id]` | Detalhe: prontuário, pets, eventos      |
| `/internacao`    | Internações, prescrições, checklist     |
| `/pdv`           | Ponto de venda (produtos + serviços)    |
| `/estoque`       | Produtos, movimentações de estoque      |
| `/financeiro`    | Receitas, despesas, contas              |
| `/fiscal`        | Notas fiscais (NFC-e, NF-e, NFS-e)      |
| `/mensagens`     | Templates WhatsApp, histórico de envios |

## Estrutura de pastas

```
src/
  components/
    layout/       # Sidebar, Topbar, Breadcrumbs, AppLayout
    ui/           # Componentes shadcn/ui (Button, Input, Dialog…)
  hooks/          # useToast
  lib/            # utils (cn, formatCurrency, formatDate, exportToCSV…)
  mocks/
    db.ts         # Banco em memória + CRUD genérico com latência simulada
    seed-*.ts     # Dados iniciais por domínio
  stores/         # Zustand: session, cart, filters
  types/          # Todos os tipos TypeScript (index.ts)
app/
  (app)/          # Grupo autenticado (layout com Sidebar + Topbar)
    dashboard/
    agenda/
    clientes/
    internacao/
    pdv/
    estoque/
    financeiro/
    fiscal/
    mensagens/
  login/
  globals.css
  layout.tsx
```

## Dados seed e regras de negócio

Os dados iniciais ficam em `src/mocks/seed-*.ts`:

| Arquivo                | Conteúdo                                          |
| ---------------------- | ------------------------------------------------- |
| `seed-users.ts`        | Usuários do sistema                               |
| `seed-clients.ts`      | Clientes, pets, eventos médicos                   |
| `seed-appointments.ts` | Agendamentos, turnos, boxes, internações          |
| `seed-commerce.ts`     | Produtos, serviços, vendas, pacotes               |
| `seed-finance.ts`      | Categorias, contas, lançamentos, notas, mensagens |

Para alterar regras de negócio (ex: status possíveis, categorias), edite os tipos em `src/types/index.ts` e os seeds correspondentes.

## Notas sobre módulos simulados

- **Fiscal**: emissão de NF é simulada localmente — em produção integraria com Focus NFe / NFe.io.
- **WhatsApp**: envio é simulado — em produção integraria com Evolution API / Z-API.
- **PDV**: ao finalizar uma venda, cria automaticamente um lançamento financeiro de receita.
- **Estoque**: movimentações de entrada/saída atualizam o campo `stock` do produto.
