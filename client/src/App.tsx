import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "@/pages/home-page";
import HomeSimple from "@/pages/home-simple";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "./lib/admin-protected-route";
import CompanyPage from "@/pages/company-page";
import CustomerPage from "@/pages/customer-page";
import ProjectPage from "@/pages/project-page";
import ProjectDetailPage from "@/pages/project-detail-page";
// UserPage wurde in den Admin-Bereich integriert
// import UserPage from "@/pages/user-page";
import QuickEntryPage from "@/pages/quick-entry-page";
import DownloadPage from "@/pages/download-page";
import AttachmentPage from "@/pages/attachment-page";
import GeoMapPage from "@/pages/geo-map-page";
import InformationPage from "@/pages/information-page";
import LandingPage from "@/pages/landing-page";
import SimpleLoginPage from "@/pages/simple-login";
import AdminPage from "@/pages/admin-page";
import DeploymentDocsPage from "@/pages/admin/deployment-docs";
import UserManagementPage from "@/pages/admin/user-management";
import SubscriptionPage from "@/pages/subscription-page";
import DataQualityPage from "@/pages/data-quality-page";
import DbStructureQualityPage from "@/pages/db-structure-quality-page";
import DbStructureFixPage from "@/pages/db-structure-fix-page";
import ConstructionDiaryDebugPage from "@/pages/construction-diary-debug";
import AdminEmailsPage from "@/pages/admin-emails";
import { NetworkStatusProvider } from "@/hooks/use-network-status";
import PageTransition from "@/components/ui/page-transition";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SimpleLoginPage} />
      <Route path="/landing" component={LandingPage} />
      <ProtectedRoute path="/dashboard" component={HomePage} />
      <ProtectedRoute path="/companies" component={CompanyPage} />
      <ProtectedRoute path="/customers" component={CustomerPage} />
      <ProtectedRoute path="/projects" component={ProjectPage} />
      <ProtectedRoute path="/projects/:id" component={ProjectDetailPage} />
      
      {/* Admin-Bereich mit spezieller Zugriffsbeschränkung */}
      <AdminProtectedRoute path="/admin" component={AdminPage} />
      <AdminProtectedRoute path="/admin/deployment-docs" component={DeploymentDocsPage} />
      <AdminProtectedRoute path="/admin/users" component={UserManagementPage} />
      <AdminProtectedRoute path="/admin/emails" component={AdminEmailsPage} />
      
      <ProtectedRoute path="/quick-entry" component={QuickEntryPage} />
      <ProtectedRoute path="/db-migration" component={DownloadPage} />
      <ProtectedRoute path="/attachments" component={AttachmentPage} />
      <ProtectedRoute path="/geo-map" component={GeoMapPage} />
      <ProtectedRoute path="/information" component={InformationPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/data-quality" component={DataQualityPage} />
      <AdminProtectedRoute path="/db-structure-quality-debug" component={DbStructureQualityPage} />
      <AdminProtectedRoute path="/db-structure-fix" component={DbStructureFixPage} />
      <ProtectedRoute path="/construction-diary-debug" component={ConstructionDiaryDebugPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/home" component={HomePage} /> {/* Direkte Route zur Homepage, wenn eingeloggt */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <NetworkStatusProvider>
      <PageTransition transitionType="fade" duration={0.2}>
        <Router />
      </PageTransition>
      <Toaster />
    </NetworkStatusProvider>
  );
}

export default App;
