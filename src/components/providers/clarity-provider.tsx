"use client";

import clarity from "@microsoft/clarity";
import { useEffect } from "react";

export function ClarityProvider() {
  useEffect(() => {
    const clarityId = "vqo256pi9f";

    if (clarityId && typeof window !== "undefined") {
      clarity.init(clarityId);
    }
  }, []);

  return null;
}
