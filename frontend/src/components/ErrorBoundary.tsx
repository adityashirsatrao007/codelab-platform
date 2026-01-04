import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1>Something went wrong.</h1>
          <h2 style={{color: '#ef4444'}}>{this.state.error?.toString()}</h2>
          <details style={{ marginTop: '20px', whiteSpace: 'pre-wrap' }}>
            {this.state.errorInfo?.componentStack}
          </details>
          <button 
            onClick={() => window.location.href = '/'} 
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#ffa116', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Go Home
          </button>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }} 
            style={{ marginTop: '20px', marginLeft: '10px', padding: '10px 20px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Clear Cache & Logout
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
