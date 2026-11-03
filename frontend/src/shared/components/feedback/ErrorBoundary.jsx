import React from "react";
import { isChunkLoadError, recoverFromStaleDeploy, withCacheBuster } from "@/shared/utils/staleDeploy";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, isUpdating: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, isUpdating: isChunkLoadError(error) };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    if (isChunkLoadError(error) && !recoverFromStaleDeploy()) {
      this.setState({ isUpdating: false });
    }
  }

  render() {
    if (this.state.hasError && this.state.isUpdating) {
      return (
        <div role="status" className="flex flex-col items-center justify-center min-h-screen gap-2 px-4">
          <p className="text-lg text-center text-richblack-200">A new version is available. Updating…</p>
        </div>
      );
    }
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
          <p className="text-lg text-center text-richblack-200">
            Something went wrong. Please reload the page.
          </p>
          <button
            onClick={() => window.location.replace(withCacheBuster(window.location.href))}
            className="px-6 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
