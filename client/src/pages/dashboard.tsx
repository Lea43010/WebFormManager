import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import StatsCard from "@/components/stats-card";
import ActivityItem from "@/components/activity-item";
import { Button } from "@/components/ui/button";
import { Activity } from "@shared/schema";

export default function Dashboard() {
  const currentDate = format(new Date(), "d. MMMM yyyy", { locale: de });

  // Fetch statistics
  const { 
    data: stats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Fetch recent activities
  const { 
    data: activities, 
    isLoading: activitiesLoading,
    refetch: refetchActivities
  } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const handleLoadMoreActivities = () => {
    refetchActivities();
  };

  return (
    <section className="space-y-6 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-neutral-800">Dashboard</h1>
        <div className="text-sm text-neutral-500">{currentDate}</div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsLoading ? (
          <div className="col-span-3 flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <StatsCard
              title="Gesamte Einträge"
              value={stats?.total || 0}
              icon="assignment"
              iconColor="text-primary"
              iconBgColor="bg-primary-light bg-opacity-10"
              changeValue={12}
              changeDirection="up"
              changePeriod="seit letztem Monat"
            />
            
            <StatsCard
              title="Heute hinzugefügt"
              value={stats?.todayAdded || 0}
              icon="today"
              iconColor="text-secondary-500"
              iconBgColor="bg-secondary-500 bg-opacity-10"
              changeValue={5}
              changeDirection="up"
              changePeriod="seit gestern"
            />
            
            <StatsCard
              title="Ausstehende Überprüfung"
              value={stats?.pendingReview || 0}
              icon="pending_actions"
              iconColor="text-warning"
              iconBgColor="bg-warning bg-opacity-10"
              changeValue={3}
              changeDirection="down"
              changePeriod="seit letzter Woche"
            />
          </>
        )}
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-medium">Letzte Aktivitäten</h2>
        </div>
        
        <div className="p-6">
          {activitiesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activities && activities.length > 0 ? (
            <ul className="divide-y divide-neutral-100">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              Keine Aktivitäten gefunden
            </div>
          )}
          
          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              className="text-primary text-sm font-medium hover:bg-primary-50"
              onClick={handleLoadMoreActivities}
            >
              Mehr anzeigen
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
