import { Suspense } from "react";
import AppRoutes from "@/app/routes/router";
import Loading from "@/shared/components/navigation/Loading";
import ErrorBoundary from "@/shared/components/feedback/ErrorBoundary";
import bgImage from "@/shared/assets/images/background.png";

export default function App() {
  return (
    <div
      className="min-h-screen w-full overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <Loading />
            </div>
          }
        >
          <AppRoutes />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
