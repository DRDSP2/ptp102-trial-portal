import { Component } from 'react';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="mb-2 text-sm font-medium text-red-800">Something went wrong loading this page.</p>
          <p className="mb-4 max-w-md text-xs text-red-600">{this.state.error?.message}</p>
          <button
            onClick={this.handleRetry}
            className="min-h-10 rounded bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
