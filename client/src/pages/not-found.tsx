import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const useNavigate = () => {
  const [_, setLocation] = useLocation();
  return setLocation;
};

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Seite nicht gefunden</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Die von Ihnen gesuchte Seite existiert nicht oder ist nicht verfügbar.
          </p>

          <div className="flex justify-center mt-6">
            <Button 
              onClick={() => navigate("/")} 
              className="bg-[#76a730] hover:bg-[#638c28] text-white"
            >
              Zurück zur Startseite
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}