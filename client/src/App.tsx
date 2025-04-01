import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "@/pages/home-page";
import HomeSimple from "@/pages/home-simple";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import CompanyPage from "@/pages/company-page";
import CustomerPage from "@/pages/customer-page";
import ProjectPage from "@/pages/project-page";
import MaterialPage from "@/pages/material-page";
import UserPage from "@/pages/user-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeSimple} />
      <Route path="/dashboard" component={HomePage} />
      <ProtectedRoute path="/companies" component={CompanyPage} />
      <ProtectedRoute path="/customers" component={CustomerPage} />
      <ProtectedRoute path="/projects" component={ProjectPage} />
      <ProtectedRoute path="/materials" component={MaterialPage} />
      <ProtectedRoute path="/users" component={UserPage} />
      <Route path="/auth" component={AuthPage} />
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
