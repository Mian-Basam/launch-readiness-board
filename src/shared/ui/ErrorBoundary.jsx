import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.reset = () => this.setState({ hasError: false });
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("Panel crashed:", error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="card cardPad" role="alert">
          <div>{this.props.fallback || "Panel failed."}</div>
          {this.props.retryLabel ? (
            <button type="button" className="btn btn--ghost mtSm" onClick={this.reset}>
              {this.props.retryLabel}
            </button>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}
