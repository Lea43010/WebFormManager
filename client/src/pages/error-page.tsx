import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Home, RefreshCw, ShieldAlert, ShieldX, WifiOff, AlertTriangle } from 'lucide-react';
import { errorHandler, ErrorCategory } from '@/lib/error-handler';

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
  error?: Error;
  errorId?: string;
  category?: ErrorCategory;
}

export default function ErrorPage({
  statusCode = 500,
  title,
  message,
  error,
  errorId: providedErrorId,
  category
}: ErrorPageProps) {
  const [_, navigate] = useLocation();
  const [errorDetails, setErrorDetails] = React.useState<{
    errorId: string;
    fullErrorText?: string;
  }>({
    errorId: providedErrorId || React.useMemo(() => 
      Math.random().toString(36).substring(2, 12).toUpperCase(), []
    )
  });

  // Wenn ein Error-Objekt übergeben wurde, logge es mit dem ErrorHandler
  React.useEffect(() => {
    if (error) {
      const errorInfo = errorHandler.captureError(error, { 
        statusCode, 
        source: 'error-page',
        manually_displayed: true
      });
      
      setErrorDetails({
        errorId: errorInfo.errorId,
        fullErrorText: process.env.NODE_ENV === 'development' 
          ? `${error.name}: ${error.message}\n${error.stack}` 
          : undefined
      });
    }
  }, [error, statusCode]);

  const handleGoBack = () => {
    navigate('/'); // Navigate to home page
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handlePrevious = () => {
    window.history.back();
  };

  // Anpassen der Fehlermeldung basierend auf dem Statuscode oder der Kategorie
  const getErrorInfo = () => {
    // Wenn explizite Titel/Nachricht angegeben wurden, diese verwenden
    if (title && message) {
      return { title, message };
    }

    // Fehler aufgrund der Kategorie klassifizieren, falls vorhanden
    if (category) {
      switch (category) {
        case ErrorCategory.NETWORK:
          return {
            title: "Netzwerkfehler",
            message: "Verbindung zum Server konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Internetverbindung.",
            icon: <WifiOff className="h-12 w-12 text-amber-600" />
          };
        case ErrorCategory.AUTHENTICATION:
          return {
            title: "Anmeldung erforderlich",
            message: "Bitte melden Sie sich an, um fortzufahren. Ihre Sitzung könnte abgelaufen sein.",
            icon: <ShieldX className="h-12 w-12 text-amber-600" />
          };
        case ErrorCategory.AUTHORIZATION:
          return {
            title: "Keine Berechtigung",
            message: "Sie haben keine Berechtigung, auf diese Ressource zuzugreifen.",
            icon: <ShieldAlert className="h-12 w-12 text-amber-600" />
          };
        case ErrorCategory.VALIDATION:
          return {
            title: "Validierungsfehler",
            message: "Die eingegebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingaben.",
            icon: <AlertTriangle className="h-12 w-12 text-yellow-600" />
          };
        default:
          break;
      }
    }

    // Sonst basierend auf Statuscode
    switch (statusCode) {
      case 401:
        return {
          title: "Nicht autorisiert",
          message: "Sie müssen sich anmelden, um auf diese Ressource zuzugreifen.",
          icon: <ShieldX className="h-12 w-12 text-amber-600" />
        };
      case 403:
        return {
          title: "Zugriff verweigert",
          message: "Sie haben keine Berechtigung, auf diese Ressource zuzugreifen.",
          icon: <ShieldAlert className="h-12 w-12 text-amber-600" />
        };
      case 404:
        return {
          title: "Seite nicht gefunden",
          message: "Die angeforderte Seite konnte nicht gefunden werden.",
          icon: <AlertCircle className="h-12 w-12 text-blue-600" />
        };
      default:
        return {
          title: "Ups! Es ist ein Fehler aufgetreten",
          message: "Es tut uns leid, aber bei der Verarbeitung Ihrer Anfrage ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie eine der folgenden Optionen:",
          icon: <AlertCircle className="h-12 w-12 text-red-600" />
        };
    }
  };

  const errorInfo = getErrorInfo();
  
  // Hintergrundfarbe basierend auf Statuscode oder Kategorie
  const getBgColor = () => {
    if (category === ErrorCategory.NETWORK) return "bg-amber-100";
    if (category === ErrorCategory.VALIDATION) return "bg-yellow-100";
    
    return statusCode === 500 ? "bg-red-100" : 
           statusCode === 404 ? "bg-blue-100" : 
           "bg-amber-100";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className={`rounded-full ${getBgColor()} p-3`}>
            {errorInfo.icon || <AlertCircle className="h-12 w-12 text-red-600" />}
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{errorInfo.title}</h1>
        
        <p className="text-gray-600 mb-8">
          {errorInfo.message}
        </p>
        
        <div className="flex flex-col space-y-3">
          <Button 
            onClick={handlePrevious} 
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur vorherigen Seite
          </Button>
          
          <Button 
            onClick={handleRefresh}
            variant="outline" 
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Seite neu laden
          </Button>
          
          <Button 
            onClick={handleGoBack}
            className="flex items-center justify-center gap-2" 
          >
            <Home className="h-4 w-4" />
            Zur Startseite
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
          <p>Wenn das Problem weiterhin besteht, kontaktieren Sie bitte unseren Support.</p>
          <p className="mt-1">Fehler-ID: {errorDetails.errorId}</p>
          {statusCode && <p className="mt-1">Statuscode: {statusCode}</p>}
          
          {/* Im Entwicklungsmodus den vollständigen Fehlertext anzeigen */}
          {errorDetails.fullErrorText && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-left overflow-auto max-h-40 text-xs">
              <pre>{errorDetails.fullErrorText}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}