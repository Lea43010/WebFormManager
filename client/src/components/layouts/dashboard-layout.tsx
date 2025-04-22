import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Sidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useAuth } from "@/hooks/use-auth";
import logoImage from "@/assets/Logo.png";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string | ReactNode;
  description?: string | ReactNode;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function DashboardLayout({
  children,
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
}: DashboardLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <header className="relative z-10 flex-shrink-0 flex h-20 bg-white border-b border-gray-200">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              {/* Logo wird bereits in der Sidebar angezeigt */}
              
              <div className="w-full max-w-lg flex md:ml-0">
                <TooltipButton tooltipText="Nach Projekten und Dokumenten suchen" side="bottom">
                  <div className="relative w-full text-gray-400">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      className="block w-full h-10 pl-10 pr-3 py-2 rounded-md border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </TooltipButton>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              <div className="hidden md:flex items-center mr-4">
                <span className="text-sm font-medium text-gray-700">
                  Willkommen, {user?.username}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TooltipButton tooltipText="Benutzereinstellungen" side="bottom">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white cursor-pointer shadow-sm">
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                </TooltipButton>
                <TooltipButton tooltipText="Abmelden" side="bottom">
                  <button 
                    onClick={() => {
                      fetch('/api/logout', { method: 'POST' })
                        .then(() => {
                          window.location.href = '/auth';
                        });
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded hover:bg-gray-100"
                    aria-label="Abmelden"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </TooltipButton>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-white">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                {location !== "/" && (
                  <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Zurück zur Übersicht
                  </a>
                )}
              </div>
              {description && (
                <p className="mt-1 text-sm text-gray-600">{description}</p>
              )}
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4">
              <div className="border-t border-gray-200 pt-4">
                {tabs && tabs.length > 0 && (
                  <>
                    <div className="border-b border-gray-200 mb-6">
                      <Tabs
                        value={activeTab || tabs[0]}
                        onValueChange={onTabChange}
                        className="-mb-px"
                      >
                        <TabsList className="bg-transparent">
                          {tabs.map((tab) => (
                            <TooltipButton 
                              key={tab}
                              tooltipText={`${tab} anzeigen`}
                              side="bottom"
                            >
                              <TabsTrigger
                                value={tab}
                                className="text-base border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-3 px-4 border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary font-medium"
                              >
                                {tab}
                              </TabsTrigger>
                            </TooltipButton>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>
                  </>
                )}
                
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
