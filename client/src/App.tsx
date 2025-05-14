import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "@/pages/home-page";
import HomeSimple from "@/pages/home-simple";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import ErrorPage from "@/pages/error-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "./lib/admin-protected-route";
import { RoleProtectedRoute } from "./lib/role-protected-route";
import CompanyPage from "@/pages/company-page";
import CustomerPage from "@/pages/customer-page";
import ProjectPage from "@/pages/project-page";
import ProjectDetailPage from "@/pages/project-detail-page";
// UserPage wurde in den Admin-Bereich integriert
// import UserPage from "@/pages/user-page";
import QuickEntryPage from "@/pages/quick-entry-page";
import DownloadPage from "@/pages/download-page";
import AttachmentPage from "@/pages/attachment-page";
import InformationPage from "@/pages/information-page";
import LandingPage from "@/pages/landing-page";
import SimpleLoginPage from "@/pages/simple-login";
import AdminPage from "@/pages/admin-page";
import DeploymentDocsPage from "@/pages/admin/deployment-docs";
import UserManagementPage from "@/pages/admin/user-management";
import BackupStatusPage from "@/pages/admin/backup-status";
// Import-Korrektur für SystemLogs-Komponente
import SystemLogsPage from "./pages/admin/system-logs";
import SQLAnalyticsPage from "@/pages/admin/sql-analytics";
import SubscriptionPage from "@/pages/subscription-page";
import DataQualityPage from "@/pages/data-quality-page";
import SearchPage from "@/pages/search-page";
import DataQualityDashboard from "@/pages/data-quality-dashboard";
import DbStructureQualityPage from "@/pages/db-structure-quality-page";
import DbStructureFixPage from "@/pages/db-structure-fix-page";
import ConstructionDiaryDebugPage from "@/pages/construction-diary-debug";
import AdminEmailsPage from "@/pages/admin-emails";
// HelpPage nicht mehr benötigt, Redirect zu InformationPage
import StreetModulesPage from "@/pages/street-modules-new";
import TiefbauMap from "@/pages/tiefbau-map";
// Direkter Import als JSX.Element-Komponente
import TiefbauMapSearchable from "@/pages/tiefbau-map-searchable";
import type { ComponentType } from "react";
import BodenAnalyse from "@/pages/BodenAnalyse";
import MaschinenAuswahl from "@/pages/MaschinenAuswahl";
import KostenKalkulationPage from "@/pages/kostenkalkulation";
// DenkmalAtlasPage entfernt - Funktionalität in TiefbauMap integriert
import ImageOptimizationDemo from "@/pages/image-optimization-demo";
import SimpleImageOptimizationDemo from "@/pages/image-optimization-demo-simple";
import { NetworkStatusProvider } from "@/hooks/use-network-status";
import PageTransition from "@/components/ui/page-transition";

import AutoTour from "@/components/onboarding/auto-tour";
import ErrorBoundary from "@/components/error-boundary";

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
      <AdminProtectedRoute path="/admin/sql-analytics" component={SQLAnalyticsPage} />
      
      <ProtectedRoute path="/quick-entry" component={QuickEntryPage} />
      <ProtectedRoute path="/db-migration" component={DownloadPage} />
      <ProtectedRoute path="/attachments" component={AttachmentPage} />
      {/* Alte Geo-Map-Routen werden auf Tiefbau-Map umgeleitet */}
      <Route path="/geo-map">
        {() => <Redirect to="/tiefbau-map" />}
      </Route>
      <Route path="/geo-map-new">
        {() => <Redirect to="/tiefbau-map" />}
      </Route>
      <Route path="/geo-map-simple">
        {() => <Redirect to="/tiefbau-map" />}
      </Route>
      <ProtectedRoute path="/information" component={InformationPage} />
      <ProtectedRoute path="/street-modules" component={StreetModulesPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <RoleProtectedRoute 
        path="/data-quality" 
        component={DataQualityPage} 
        requiredRole={['administrator', 'manager']} 
      />
      <ProtectedRoute path="/search" component={SearchPage} />
      <RoleProtectedRoute 
        path="/admin/data-quality" 
        component={DataQualityPage}
        requiredRole="administrator"
      />
      <RoleProtectedRoute 
        path="/admin/data-quality-dashboard" 
        component={DataQualityDashboard}
        requiredRole="administrator"
      />
      <ProtectedRoute path="/construction-diary-debug" component={ConstructionDiaryDebugPage} />
      <ProtectedRoute path="/tiefbau-map" component={() => <TiefbauMap />} />
      <ProtectedRoute path="/tiefbau-map-searchable" component={TiefbauMapSearchable} />
      <ProtectedRoute path="/bodenanalyse" component={BodenAnalyse} />
      <ProtectedRoute path="/boden-analyse" component={BodenAnalyse} />
      <ProtectedRoute path="/bodenanalyse-test" component={() => import("@/pages/bodenanalyse-test").then(mod => mod.default)} />
      <ProtectedRoute path="/maschinen-auswahl" component={() => <MaschinenAuswahl />} />
      <ProtectedRoute path="/kostenkalkulation" component={KostenKalkulationPage} />
      {/* DenkmalAtlas direkt auf externe URL weiterleiten */}
      <Route path="/denkmal-atlas">
        {() => {
          window.open("https://geoportal.bayern.de/denkmalatlas/", "_blank");
          return <Redirect to="/tiefbau-map" />;
        }}
      </Route>
      <ProtectedRoute path="/image-optimization" component={ImageOptimizationDemo} />
      <ProtectedRoute path="/image-optimization-simple" component={SimpleImageOptimizationDemo} />
      <Route path="/help">
        {() => <Redirect to="/information" />}
      </Route>
      <Route path="/geo">
        {() => <Redirect to="/tiefbau-map" />}
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

      {/* Öffentliche Beispielrouten für Fehlerseiten ohne Login-Erfordernis */}
      <Route path="/error-demo" component={() => <ErrorPage />} />
      <Route path="/error-demo/500" component={() => <ErrorPage statusCode={500} />} />
      <Route path="/error-demo/403" component={() => (
        <ErrorPage 
          statusCode={403} 
          title="Zugriff verweigert" 
          message="Sie haben keine Berechtigung, auf diese Ressource zuzugreifen." 
        />
      )} />
      <Route path="/error-demo/404" component={() => (
        <ErrorPage 
          statusCode={404} 
          title="Seite nicht gefunden" 
          message="Die angeforderte Seite konnte nicht gefunden werden." 
        />
      )} />
      <Route path="/error-demo/401" component={() => (
        <ErrorPage 
          statusCode={401} 
          title="Nicht autorisiert" 
          message="Sie müssen sich anmelden, um auf diese Ressource zuzugreifen." 
        />
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <NetworkStatusProvider>
        <PageTransition transitionType="fade" duration={0.2}>
          <Router />
        </PageTransition>
        <Toaster />
        <AutoTour />
      </NetworkStatusProvider>
    </ErrorBoundary>
  );
}

export default App;
