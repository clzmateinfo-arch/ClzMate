import React, { Suspense } from "react";
import AppRoutes from "@/app/routes/router";

export default function App() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <AppRoutes />
    </Suspense>
  );
}
