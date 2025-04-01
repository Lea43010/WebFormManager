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
import MaterialPage from "@/pages/material-page";
import UserPage from "@/pages/user-page";
import QuickEntryPage from "@/pages/quick-entry-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomeSimple} />
      <ProtectedRoute path="/dashboard" component={HomePage} />
      <ProtectedRoute path="/companies" component={CompanyPage} />
      <ProtectedRoute path="/customers" component={CustomerPage} />
      <ProtectedRoute path="/projects" component={ProjectPage} />
      <ProtectedRoute path="/materials" component={MaterialPage} />
      <ProtectedRoute path="/users" component={UserPage} />
      <ProtectedRoute path="/quick-entry" component={QuickEntryPage} />
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
