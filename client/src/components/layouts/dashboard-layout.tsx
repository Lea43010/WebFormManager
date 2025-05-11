import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Sidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useAuth } from "@/hooks/use-auth";
import { Search } from "lucide-react";
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
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F4F6]">
      <Sidebar />
      
      <div className="flex flex-col w-full flex-1 overflow-hidden">
        <header className="relative z-10 flex-shrink-0 flex h-16 sm:h-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex-1 px-responsive flex justify-between">
            <div className="flex-1 flex items-center">
              {/* Platzhalter für Menü-Button auf mobilen Geräten */}
              <div className="w-8 h-8 md:hidden"></div>
              
              <div className="w-full max-w-lg flex ml-2 md:ml-0">
                <div className="relative w-full text-gray-400">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                  </div>
                  <input
                    className="block w-full h-8 sm:h-10 pl-8 sm:pl-10 pr-2 sm:pr-3 py-1 sm:py-2 text-sm sm:text-base rounded-md border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary min-touch-target"
                    placeholder="Universelle Suche..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        // Zur Suchseite navigieren mit Query-Parameter
                        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="ml-2 sm:ml-4 flex items-center">
              <div className="hidden md:flex items-center mr-4">
                <span className="text-sm font-medium text-gray-700">
                  Willkommen, {user?.username}
                </span>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary flex items-center justify-center text-white cursor-pointer shadow-sm">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <button 
                  onClick={() => {
                    fetch('/api/logout', { method: 'POST' })
                      .then(() => {
                        window.location.href = '/auth';
                      });
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-1 sm:py-1.5 rounded hover:bg-gray-100 min-touch-target flex items-center justify-center"
                  aria-label="Abmelden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-[#F3F4F6]">
          <div className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-responsive">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-responsive">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{title}</h1>
              </div>
              {description && (
                <p className="mt-1 text-xs sm:text-sm text-gray-600">{description}</p>
              )}
            </div>
            
            <div className="max-w-7xl mx-auto px-responsive mt-responsive">
              <div className="pt-responsive">
                {tabs && tabs.length > 0 && (
                  <>
                    <div className="border-b border-gray-200 mb-responsive overflow-x-auto -mx-3 px-3 sm:-mx-0 sm:px-0">
                      <Tabs
                        value={activeTab || tabs[0]}
                        onValueChange={onTabChange}
                        className="-mb-px"
                      >
                        <TabsList className="bg-transparent w-auto inline-flex">
                          {tabs.map((tab) => (
                            <TabsTrigger
                              key={tab}
                              value={tab}
                              className="text-sm sm:text-base border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-2 sm:py-3 px-2 sm:px-4 border-b-2 data-[state=active]:border-[#6a961f] data-[state=active]:text-[#6a961f] font-medium whitespace-nowrap min-touch-target"
                            >
                              {tab}
                            </TabsTrigger>
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
