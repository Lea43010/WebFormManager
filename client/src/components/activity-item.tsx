import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Activity } from "@shared/schema";

interface ActivityItemProps {
  activity: Activity;
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  // Format the date
  const formattedDate = activity.createdAt 
    ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: de })
    : "";
  
  // Determine icon based on action
  const getIcon = () => {
    switch (activity.action) {
      case "add":
        return <PlusCircle className="h-5 w-5 text-primary mr-3" />;
      case "edit":
        return <Edit className="h-5 w-5 text-secondary-500 mr-3" />;
      case "delete":
        return <Trash2 className="h-5 w-5 text-error mr-3" />;
      default:
        return <PlusCircle className="h-5 w-5 text-primary mr-3" />;
    }
  };
  
  // Get action text
  const getActionText = () => {
    switch (activity.action) {
      case "add":
        return "Neuer Eintrag hinzugefügt";
      case "edit":
        return "Eintrag aktualisiert";
      case "delete":
        return "Eintrag gelöscht";
      default:
        return "Aktion durchgeführt";
    }
  };
  
  return (
    <li className="py-3 flex items-start">
      {getIcon()}
      <div>
        <p className="text-sm font-medium">
          {getActionText()}
          {activity.entityId && (
            <span className="font-normal text-neutral-500 ml-1">
              ID: {activity.entityId}
            </span>
          )}
        </p>
        <p className="text-xs text-neutral-500">{formattedDate}</p>
      </div>
    </li>
  );
}
