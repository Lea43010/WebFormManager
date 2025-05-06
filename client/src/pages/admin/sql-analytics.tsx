import React from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import SQLQueryAnalytics from '@/components/admin/sql-query-analytics';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Redirect } from 'wouter';

const SQLAnalyticsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  // Überprüfen, ob der Benutzer ein Administrator ist
  if (!user || user.role !== 'administrator') {
    return <Redirect to="/" />;
  }
  
  return (
    <AdminLayout>
      <SQLQueryAnalytics />
    </AdminLayout>
  );
};

export default SQLAnalyticsPage;