import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorPage from '@/pages/error-page';
import { errorHandler, ErrorCategory } from '@/lib/error-handler';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Fehler mit dem zentralen ErrorHandler verarbeiten
    const errorData = errorHandler.captureError(error, {
      source: 'react-error-boundary',
      componentStack: errorInfo.componentStack
    });

    // Optionaler Callback für benutzerdefinierte Fehlerbehandlung
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Zustand aktualisieren mit Error-ID und ErrorInfo
    this.setState({
      errorInfo,
      errorId: errorData.errorId
    });

    // Log auch in der Konsole für die Entwicklung
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  // Fehlerkomponente zurücksetzen und erneut versuchen
  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI from props, wenn vorhanden
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Fehler-Details für die ErrorPage vorbereiten
      const errorMessage = this.state.error?.message 
        ? `${this.state.error.message}`
        : "Ein unerwarteter Fehler ist beim Rendern der Komponente aufgetreten.";
      
      // Erweiterte Fehlernachricht in der Entwicklungsumgebung
      const devMessage = process.env.NODE_ENV === 'development' && this.state.errorInfo
        ? `${errorMessage}\n\nKomponentenstapel: ${this.state.errorInfo.componentStack}`
        : errorMessage;

      // Default error page mit Retry-Option
      return (
        <ErrorPage 
          statusCode={500}
          title="Unerwarteter Rendering-Fehler"
          message={errorMessage}
          error={this.state.error || undefined}
          errorId={this.state.errorId || undefined}
          category={ErrorCategory.CLIENT}
          onRetry={this.handleRetry}
          showDevInfo={process.env.NODE_ENV === 'development'}
          devMessage={devMessage}
        />
      );
    }

    // Wenn kein Fehler, normal rendern
    return this.props.children;
  }
}

export default ErrorBoundary;