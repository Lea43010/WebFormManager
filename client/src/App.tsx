import { Switch, Route, Redirect } from "wouter";
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
// Geo-bezogene Seiten wurden temporär entfernt für Fehlersuche
import InformationPage from "@/pages/information-page";
import LandingPage from "@/pages/landing-page";
import SimpleLoginPage from "@/pages/simple-login";
import AdminPage from "@/pages/admin-page";
import DeploymentDocsPage from "@/pages/admin/deployment-docs";
import UserManagementPage from "@/pages/admin/user-management";
import BackupStatusPage from "@/pages/admin/backup-status";
// Import-Korrektur für SystemLogs-Komponente
import SystemLogsPage from "./pages/admin/system-logs";
import SubscriptionPage from "@/pages/subscription-page";
import DataQualityPage from "@/pages/data-quality-page";
import DataQualityDashboard from "@/pages/data-quality-dashboard";
import DbStructureQualityPage from "@/pages/db-structure-quality-page";
import DbStructureFixPage from "@/pages/db-structure-fix-page";
import ConstructionDiaryDebugPage from "@/pages/construction-diary-debug";
import AdminEmailsPage from "@/pages/admin-emails";
// HelpPage nicht mehr benötigt, Redirect zu InformationPage
import StreetModulesPage from "@/pages/street-modules-new";
import GeoMapPlaceholder from "@/pages/geo-map-placeholder";
import GeoMapNew from "@/pages/geo-map-new";
import { NetworkStatusProvider } from "@/hooks/use-network-status";
import PageTransition from "@/components/ui/page-transition";
import AutoTour from "@/components/onboarding/auto-tour";

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
      <AdminProtectedRoute path="/admin/backup-status" component={BackupStatusPage} />
      <AdminProtectedRoute path="/admin/logs" component={SystemLogsPage} />
      
      <ProtectedRoute path="/quick-entry" component={QuickEntryPage} />
      <ProtectedRoute path="/db-migration" component={DownloadPage} />
      <ProtectedRoute path="/attachments" component={AttachmentPage} />
      <ProtectedRoute path="/geo-map" component={GeoMapPlaceholder} />
      <ProtectedRoute path="/geo-map-new" component={GeoMapNew} />
      <ProtectedRoute path="/information" component={InformationPage} />
      <ProtectedRoute path="/street-modules" component={StreetModulesPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/data-quality" component={DataQualityPage} />
      <AdminProtectedRoute path="/admin/data-quality" component={DataQualityPage} />
      <AdminProtectedRoute path="/admin/data-quality-dashboard" component={DataQualityDashboard} />
      <ProtectedRoute path="/construction-diary-debug" component={ConstructionDiaryDebugPage} />
      <Route path="/help">
        {() => <Redirect to="/information" />}
      </Route>
      <Route path="/geo">
        {() => <Redirect to="/geo-map-new" />}
      </Route>
      <Route path="/auth" component={AuthPage} />
      <Route path="/home" component={HomePage} /> {/* Direkte Route zur Homepage, wenn eingeloggt */}
      {/* Maps-Test-Seite temporär entfernt */}
      <Route path="/startup-test">
        {() => {
          // Einfache statische Testseite direkt hier
          return (
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
              <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
                Startup Test
              </h1>
              
              <div style={{ 
                border: "1px solid #e2e8f0", 
                borderRadius: "0.5rem", 
                padding: "1.5rem", 
                marginBottom: "1.5rem", 
                background: "white" 
              }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                  Server Status
                </h2>
                
                <div style={{ 
                  padding: "1rem", 
                  border: "1px solid #e2e8f0", 
                  borderRadius: "0.375rem", 
                  background: "#f8fafc" 
                }}>
                  <p style={{ marginBottom: "1rem" }}>
                    Erfolgreicher Server-Start bestätigt.
                    Einfache Testseite ohne komplexe Komponenten.
                  </p>
                  
                  <button 
                    style={{
                      backgroundColor: "#3b82f6",
                      color: "white",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.25rem",
                      fontWeight: "500",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    Test Button
                  </button>
                </div>
              </div>
            </div>
          );
        }}
      </Route> {/* Sehr einfache Test-Seite direkt in App.tsx */}
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
      <AutoTour />
    </NetworkStatusProvider>
  );
}

export default App;
