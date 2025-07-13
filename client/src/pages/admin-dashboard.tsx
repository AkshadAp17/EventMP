import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import AdminSidebar from "@/components/admin-sidebar";
import CreateEventModal from "@/components/create-event-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, DollarSign, TrendingUp, Plus, Download, Mail, BarChart3 } from "lucide-react";

type DashboardStats = {
  totalEvents: number;
  totalAttendees: number;
  totalRevenue: number;
  conversionRate: number;
};

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const { data: events } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-800 mb-4">Access Denied</h1>
              <p className="text-slate-600 mb-4">You need admin privileges to access this page.</p>
              <Button onClick={() => window.location.href = "/events"}>
                Go to Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} user={user} />
      
      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-slate-800">
                {activeTab === "dashboard" ? "Dashboard" : 
                 activeTab === "events" ? "Event Management" :
                 activeTab === "attendees" ? "Attendee Management" :
                 activeTab === "tickets" ? "Ticket Management" :
                 activeTab === "analytics" ? "Analytics & Reports" :
                 "Event Discovery"}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={user.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName} ${user.lastName}`} 
                  alt="User Avatar" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-slate-700">
                  {user.firstName} {user.lastName}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {activeTab === "dashboard" && (
          <main className="p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Events</p>
                      <p className="text-3xl font-bold text-slate-800">
                        {statsLoading ? "..." : stats?.totalEvents || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="text-blue-600 h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 font-medium">+12%</span>
                    <span className="text-slate-500 ml-1">vs last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Attendees</p>
                      <p className="text-3xl font-bold text-slate-800">
                        {statsLoading ? "..." : stats?.totalAttendees || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="text-green-600 h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 font-medium">+23%</span>
                    <span className="text-slate-500 ml-1">vs last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Revenue</p>
                      <p className="text-3xl font-bold text-slate-800">
                        {statsLoading ? "..." : `$${stats?.totalRevenue?.toLocaleString() || 0}`}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="text-emerald-600 h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 font-medium">+8%</span>
                    <span className="text-slate-500 ml-1">vs last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Conversion Rate</p>
                      <p className="text-3xl font-bold text-slate-800">
                        {statsLoading ? "..." : `${stats?.conversionRate || 0}%`}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-purple-600 h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-red-600 font-medium">-2%</span>
                    <span className="text-slate-500 ml-1">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Events & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {events?.slice(0, 3).map((event: any) => (
                        <div key={event.id} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg">
                          <img 
                            src={event.imageUrl || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80`}
                            alt={event.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800">{event.name}</h4>
                            <p className="text-sm text-slate-600">
                              {new Date(event.startDate).toLocaleDateString()} • {new Date(event.startDate).toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-slate-500">{event.location}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              event.status === 'active' ? 'bg-green-100 text-green-800' :
                              event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                              event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {event.status}
                            </span>
                            <p className="text-sm font-medium text-slate-800 mt-1">
                              {event.currentAttendees} attendees
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full justify-start border-2 border-dashed border-primary-300 text-primary-600 hover:bg-primary-50"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Event
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Export Attendee Data
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Notifications
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <main className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Event Management</h2>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary-500 hover:bg-primary-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center text-slate-600">
                  Events management interface would be implemented here.
                  This would include event listing, editing, and deletion functionality.
                </div>
              </CardContent>
            </Card>
          </main>
        )}

        {/* Other tabs would be implemented similarly */}
        {(activeTab === "attendees" || activeTab === "tickets" || activeTab === "analytics") && (
          <main className="p-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-slate-600">
                  {activeTab === "attendees" && "Attendee management interface would be implemented here."}
                  {activeTab === "tickets" && "Ticket management interface would be implemented here."}
                  {activeTab === "analytics" && "Analytics and reporting interface would be implemented here."}
                </div>
              </CardContent>
            </Card>
          </main>
        )}

        {/* User View */}
        {activeTab === "users" && (
          <main className="p-6">
            <div className="text-center">
              <Button 
                onClick={() => window.location.href = "/events"}
                className="bg-primary-500 hover:bg-primary-600"
              >
                Switch to User View
              </Button>
            </div>
          </main>
        )}
      </div>

      <CreateEventModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
