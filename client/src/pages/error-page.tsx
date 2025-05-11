import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "wouter";

interface ErrorPageProps {
  title?: string;
  message?: string;
  statusCode?: number;
}

export default function ErrorPage({ 
  title = "Ein Fehler ist aufgetreten", 
  message = "Es gab ein Problem bei der Verarbeitung Ihrer Anfrage. Bitte versuchen Sie es später erneut.",
  statusCode = 500
}: ErrorPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>

          {statusCode && (
            <div className="my-3 px-3 py-1 bg-gray-100 inline-block rounded-md">
              <span className="text-gray-600 font-mono">Status: {statusCode}</span>
            </div>
          )}

          <p className="mt-4 text-sm text-gray-600">
            {message}
          </p>
          
          <div className="flex justify-center mt-6 space-x-4">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Seite neu laden
            </Button>
            <Button 
              onClick={() => navigate("/")} 
              className="bg-[#76a730] hover:bg-[#638c28] text-white"
            >
              Zur Startseite
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}