import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "@/pages/home-page";
import HomeSimple from "@/pages/home-simple";
import AuthPage from "@/pages/auth-page";
import UnprotectedAuthPage from "@/pages/unprotected-auth";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import CompanyPage from "@/pages/company-page";
import CustomerPage from "@/pages/customer-page";
import ProjectPage from "@/pages/project-page";
import UserPage from "@/pages/user-page";
import QuickEntryPage from "@/pages/quick-entry-page";
import DownloadPage from "@/pages/download-page";
import AttachmentPage from "@/pages/attachment-page";
import GeoMapPage from "@/pages/geo-map-page";
import InformationPage from "@/pages/information-page";
import LandingPage from "@/pages/landing-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <ProtectedRoute path="/dashboard" component={HomePage} />
      <ProtectedRoute path="/companies" component={CompanyPage} />
      <ProtectedRoute path="/customers" component={CustomerPage} />
      <ProtectedRoute path="/projects" component={ProjectPage} />

      <ProtectedRoute path="/users" component={UserPage} />
      <ProtectedRoute path="/quick-entry" component={QuickEntryPage} />
      <ProtectedRoute path="/db-migration" component={DownloadPage} />
      <ProtectedRoute path="/attachments" component={AttachmentPage} />
      <ProtectedRoute path="/geo-map" component={GeoMapPage} />
      <ProtectedRoute path="/information" component={InformationPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={UnprotectedAuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
