"use client";

/**
 * VerticalTabs
 * Desktop: sidebar vertical à esquerda
 * Mobile: select dropdown no topo
 */

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      {/* Mobile: select dropdown */}
      <div className="md:hidden mb-4">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: sidebar + content */}
      <div className="flex gap-6">
        <div className="hidden md:block w-56 shrink-0">
          <div className="sticky top-4 space-y-1">
            <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4">{children}</div>
      </div>
    </Tabs>
  );
}
