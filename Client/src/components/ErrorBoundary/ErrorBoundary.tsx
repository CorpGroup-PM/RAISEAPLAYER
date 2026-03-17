"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * React Error Boundary — catches unhandled JS errors in the component tree
 * and renders a friendly fallback instead of a blank/broken page.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "40vh",
            padding: "2rem",
            textAlign: "center",
            gap: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            Something went wrong
          </h2>
          <p style={{ color: "#6c757d", maxWidth: 400 }}>
            An unexpected error occurred. Please refresh the page or try again.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.375rem",
              border: "1px solid #dee2e6",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
