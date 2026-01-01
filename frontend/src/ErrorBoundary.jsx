import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("React crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", color: "red" }}>
          <h2>Something went wrong.</h2>
          <p>Check browser console for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
