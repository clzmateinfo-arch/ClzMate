import React, { Suspense } from "react";
import AppRoutes from "@/app/routes/router";
import Loading from "@/shared/components/navigation/Loading";

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loading />
        </div>
      }
    >
      <AppRoutes />
    </Suspense>
  );
}
