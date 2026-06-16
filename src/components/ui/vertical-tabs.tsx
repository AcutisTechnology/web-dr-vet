"use client";

/**
 * VerticalTabs
 * Mantém o nome da API antiga, mas renderiza uma navegação horizontal
 * scrollável para liberar espaço lateral nas telas densas, como a ficha do pet.
 */

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabItem {
  value: string;
  label: string;
}

interface VerticalTabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}

export function VerticalTabs({
  tabs,
  value,
  onValueChange,
  children,
}: VerticalTabsProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef({ active: false, startX: 0, scrollLeft: 0 });

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: el.scrollLeft,
    };
    el.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el || !drag.current.active) return;
    el.scrollLeft = drag.current.scrollLeft - (event.clientX - drag.current.startX);
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  const scrollTabs = (direction: "left" | "right") => {
    scrollerRef.current?.scrollBy({
      left: direction === "left" ? -280 : 280,
      behavior: "smooth",
    });
  };

  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full space-y-4">
      <div className="relative -mx-4 border-y border-border bg-white px-12 py-3 shadow-sm sm:mx-0 sm:rounded-2xl sm:border sm:shadow-md">
        <button
          type="button"
          onClick={() => scrollTabs("left")}
          className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
          aria-label="Rolar abas para a esquerda"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div
          ref={scrollerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          className="cursor-grab overflow-x-auto active:cursor-grabbing [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <TabsList className="inline-flex h-auto min-w-max justify-start gap-2 bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-10 rounded-full border border-border/80 bg-muted/40 px-4 text-xs font-semibold shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <button
          type="button"
          onClick={() => scrollTabs("right")}
          className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
          aria-label="Rolar abas para a direita"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <p className="mt-2 text-[11px] text-muted-foreground sm:hidden">Arraste para o lado para ver mais abas.</p>
      </div>

      <div className="min-w-0 space-y-4">{children}</div>
    </Tabs>
  );
}
