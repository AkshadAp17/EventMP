import { Button } from "@/components/ui/button";
import { Calendar, BarChart3, Users, Ticket, Settings, Eye } from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
}

export default function AdminSidebar({ activeTab, onTabChange, user }: AdminSidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "events", label: "Events", icon: Calendar },
    { id: "attendees", label: "Attendees", icon: Users },
    { id: "tickets", label: "Tickets", icon: Ticket },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "users", label: "User View", icon: Eye },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-slate-200 z-30">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <Calendar className="text-white h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">EventMaster</h2>
            <p className="text-sm text-slate-500">Admin Panel</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start ${
                isActive 
                  ? "bg-primary-50 text-primary-700 hover:bg-primary-100" 
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-slate-100 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <img 
              src={user?.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName} ${user?.lastName}`}
              alt="Admin Profile" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
