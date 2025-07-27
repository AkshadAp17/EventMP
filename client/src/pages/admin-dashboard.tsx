import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import AdminSidebar from "@/components/admin-sidebar";
import CreateEventModal from "@/components/create-event-modal";
import EditEventModal from "@/components/edit-event-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, DollarSign, TrendingUp, Plus, Download, Mail, BarChart3, CalendarDays, Filter, ArrowUpDown, Edit, Trash2, Eye, LogOut, User, Settings } from "lucide-react";

// Export Functions
const exportAttendees = async () => {
  try {
    const response = await fetch('/api/export/attendees', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendees-export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  } catch (error) {
    console.error('Export failed:', error);
  }
};

const exportTickets = async () => {
  try {
    const response = await fetch('/api/export/tickets', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tickets-export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  } catch (error) {
    console.error('Export failed:', error);
  }
};

// Send Notification Modal Component
function SendNotificationModal() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [eventId, setEventId] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { title: string; message: string; eventId?: string }) => {
      return apiRequest('/api/notifications/bulk', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Notifications Sent",
        description: data.message,
      });
      setIsOpen(false);
      setTitle('');
      setMessage('');
      setEventId('');
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notifications",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    
    sendNotificationMutation.mutate({
      title,
      message,
      eventId: eventId || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="w-4 h-4 mr-2" />
          Send Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Notification</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message to attendees"
              rows={4}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Event (Optional)</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All attendees</option>
              {events?.map((event: any) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendNotificationMutation.isPending}>
              {sendNotificationMutation.isPending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Attendees Table Component
function AttendeesTable() {
  const { data: bookings } = useQuery({
    queryKey: ["/api/bookings"],
    retry: false,
  });

  return (
    <div className="overflow-x-auto">
      {bookings && bookings.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left p-4 font-semibold text-slate-700">Name</th>
              <th className="text-left p-4 font-semibold text-slate-700">Email</th>
              <th className="text-left p-4 font-semibold text-slate-700">Event</th>
              <th className="text-left p-4 font-semibold text-slate-700">Tickets</th>
              <th className="text-left p-4 font-semibold text-slate-700">Status</th>
              <th className="text-left p-4 font-semibold text-slate-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking: any) => (
              <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4">
                  <p className="font-semibold text-slate-800">{booking.attendeeName}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm text-slate-800">{booking.attendeeEmail}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm text-slate-800">{booking.event?.name || 'Unknown Event'}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm text-slate-800">{booking.quantity}</p>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                </td>
                <td className="p-4">
                  <p className="text-sm text-slate-800">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">No attendees yet</h3>
          <p className="text-slate-600">Attendees will appear here once events are booked</p>
        </div>
      )}
    </div>
  );
}

// View Ticket Modal Component
function ViewTicketModal({ booking }: { booking: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ticket Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Booking Reference</label>
            <p className="font-mono text-sm">{booking.bookingReference}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Event</label>
            <p>{booking.event?.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Attendee</label>
            <p>{booking.attendeeName}</p>
            <p className="text-sm text-slate-500">{booking.attendeeEmail}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Quantity</label>
              <p>{booking.quantity}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Amount</label>
              <p>${booking.totalAmount}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Status</label>
            <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {booking.status}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Booking Date</label>
            <p>{new Date(booking.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Tickets Table Component
function TicketsTable() {
  const { data: bookings } = useQuery({
    queryKey: ["/api/bookings"],
    retry: false,
  });

  return (
    <div className="overflow-x-auto">
      {bookings && bookings.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left p-4 font-semibold text-slate-700">Booking ID</th>
              <th className="text-left p-4 font-semibold text-slate-700">Event</th>
              <th className="text-left p-4 font-semibold text-slate-700">Attendee</th>
              <th className="text-left p-4 font-semibold text-slate-700">Quantity</th>
              <th className="text-left p-4 font-semibold text-slate-700">Amount</th>
              <th className="text-left p-4 font-semibold text-slate-700">Status</th>
              <th className="text-left p-4 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking: any) => (
              <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4">
                  <p className="font-mono text-sm text-slate-800">{booking.bookingReference}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm text-slate-800">{booking.event?.name || 'Unknown Event'}</p>
                </td>
                <td className="p-4">
                  <div>
                    <p className="font-semibold text-slate-800">{booking.attendeeName}</p>
                    <p className="text-xs text-slate-600">{booking.attendeeEmail}</p>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-sm text-slate-800">{booking.quantity}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm font-medium text-slate-800">${booking.totalAmount}</p>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                </td>
                <td className="p-4">
                  <ViewTicketModal booking={booking} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">No tickets yet</h3>
          <p className="text-slate-600">Ticket bookings will appear here once events are booked</p>
        </div>
      )}
    </div>
  );
}

type DashboardStats = {
  totalEvents: number;
  totalAttendees: number;
  totalRevenue: number;
  conversionRate: number;
};

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  
  // Event filtering and sorting states
  const [dateFilterFrom, setDateFilterFrom] = useState("");
  const [dateFilterTo, setDateFilterTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Handler functions
  const handleDateFromChange = (value: string) => {
    setDateFilterFrom(value);
    if (value && !dateFilterTo) {
      // Auto-set end date to 7 days after start date
      const startDate = new Date(value);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      setDateFilterTo(endDate.toISOString().split('T')[0]);
    }
  };

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

  // For admin dashboard, fetch all events regardless of status
  const { data: rawEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
    queryFn: () => fetch("/api/events?status=").then(res => res.json()),
    retry: false,
  });

  // Process and filter events
  const events = rawEvents ? [...rawEvents]
    .filter(event => {
      // Date filtering
      if (dateFilterFrom && dateFilterTo) {
        const eventStart = new Date(event.startDate);
        const filterFrom = new Date(dateFilterFrom);
        const filterTo = new Date(dateFilterTo);
        return eventStart >= filterFrom && eventStart <= filterTo;
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = sortBy === 'createdAt' ? new Date(a.createdAt) : 
                   sortBy === 'startDate' ? new Date(a.startDate) : 
                   sortBy === 'name' ? a.name : a[sortBy];
      const bVal = sortBy === 'createdAt' ? new Date(b.createdAt) : 
                   sortBy === 'startDate' ? new Date(b.startDate) : 
                   sortBy === 'name' ? b.name : b[sortBy];
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    }) : [];

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiRequest("DELETE", `/api/events/${eventId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted",
        description: "The event has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
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
      
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const handleDeleteEvent = (event: any) => {
    if (window.confirm(`Are you sure you want to delete "${event.name}"? This action cannot be undone.`)) {
      deleteEventMutation.mutate(event.id);
    }
  };

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
      <div className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <h1 className="text-lg lg:text-2xl font-bold text-slate-800 truncate">
                {activeTab === "dashboard" ? "Dashboard" : 
                 activeTab === "events" ? "Event Management" :
                 activeTab === "attendees" ? "Attendee Management" :
                 activeTab === "tickets" ? "Ticket Management" :
                 activeTab === "analytics" ? "Analytics & Reports" :
                 activeTab === "user-view" ? "User View" :
                 "Event Discovery"}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 lg:space-x-3 hover:bg-slate-100">
                    <img 
                      src={user.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName} ${user.lastName}`} 
                      alt="User Avatar" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-slate-700 hidden sm:block">
                      {user.firstName} {user.lastName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = "/profile"}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setActiveTab("user-view")}
                    className="cursor-pointer"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    <span>User View</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      // Clear session and redirect to logout
                      fetch('/api/logout', { method: 'POST', credentials: 'include' })
                        .then(() => {
                          window.location.href = "/auth";
                        })
                        .catch(() => {
                          // Fallback logout
                          window.location.href = "/auth";
                        });
                    }}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {activeTab === "dashboard" && (
          <main className="p-4 lg:p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {eventsLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Loading events...</p>
                        </div>
                      ) : events && events.length > 0 ? (
                        events.slice(0, 3).map((event: any) => (
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
                            <div className="mt-2 w-32">
                              <div className="flex justify-between text-xs text-slate-600 mb-1">
                                <span>{event.currentAttendees}</span>
                                <span>{event.maxAttendees}</span>
                              </div>
                              <Progress 
                                value={(event.currentAttendees / event.maxAttendees) * 100} 
                                className="h-2"
                              />
                              <p className="text-xs text-slate-500 mt-1">
                                {Math.round((event.currentAttendees / event.maxAttendees) * 100)}% filled
                              </p>
                            </div>
                          </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-600">No events found</p>
                        </div>
                      )}
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
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={exportAttendees}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Attendee Data
                  </Button>
                  
                  <div className="w-full">
                    <SendNotificationModal />
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/reports/generate', {
                          method: 'GET',
                          credentials: 'include',
                        });
                        
                        if (response.ok) {
                          const report = await response.json();
                          const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `eventmaster-report-${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          toast({
                            title: "Report Generated",
                            description: "Analytics report has been downloaded successfully",
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to generate report",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
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
          <main className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-slate-800">Event Management</h2>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary-500 hover:bg-primary-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>

            {/* Filters and Controls */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-4">
                  {/* Date Range Filter */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-slate-600" />
                      <label className="text-sm font-medium text-slate-700">From:</label>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <input
                        type="date"
                        value={dateFilterFrom}
                        onChange={(e) => handleDateFromChange(e.target.value)}
                        className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="text-sm font-medium text-slate-700">To:</label>
                      <input
                        type="date"
                        value={dateFilterTo}
                        onChange={(e) => setDateFilterTo(e.target.value)}
                        className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Sort Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-slate-600" />
                      <label className="text-sm font-medium text-slate-700">Sort by:</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="createdAt">Created Date</option>
                        <option value="startDate">Event Date</option>
                        <option value="name">Name</option>
                        <option value="status">Status</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-3 py-1 border border-slate-300 rounded-md text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                      </button>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateFilterFrom("");
                      setDateFilterTo("");
                      setSortBy("createdAt");
                      setSortOrder("desc");
                    }}
                    className="ml-auto"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>

                  {/* Event Count */}
                  <div className="text-sm text-slate-600">
                    Showing {events?.length || 0} events
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {events && events.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left p-4 font-semibold text-slate-700">Event</th>
                            <th className="text-left p-4 font-semibold text-slate-700">Event Date</th>
                            <th className="text-left p-4 font-semibold text-slate-700">Created</th>
                            <th className="text-left p-4 font-semibold text-slate-700">Location</th>
                            <th className="text-left p-4 font-semibold text-slate-700">Attendees</th>
                            <th className="text-left p-4 font-semibold text-slate-700">Price</th>
                            <th className="text-left p-4 font-semibold text-slate-700">Status</th>
                            <th className="text-left p-4 font-semibold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map((event: any) => (
                            <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="p-4">
                                <div className="flex items-center space-x-3">
                                  <img 
                                    src={event.imageUrl || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60`}
                                    alt={event.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                  <div>
                                    <h4 className="font-semibold text-slate-800">{event.name}</h4>
                                    <p className="text-sm text-slate-600">{event.category}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="text-sm">
                                  <p className="font-medium text-slate-800">
                                    {new Date(event.startDate).toLocaleDateString()}
                                  </p>
                                  <p className="text-slate-600">
                                    {new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="text-sm">
                                  <p className="font-medium text-slate-800">
                                    {new Date(event.createdAt).toLocaleDateString()}
                                  </p>
                                  <p className="text-slate-600">
                                    {new Date(event.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="text-sm text-slate-800">{event.location}</p>
                              </td>
                              <td className="p-4">
                                <div className="w-24">
                                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                                    <span>{event.currentAttendees || 0}</span>
                                    <span>{event.maxAttendees}</span>
                                  </div>
                                  <Progress 
                                    value={((event.currentAttendees || 0) / event.maxAttendees) * 100} 
                                    className="h-2"
                                  />
                                  <p className="text-xs text-slate-500 mt-1 text-center">
                                    {Math.round(((event.currentAttendees || 0) / event.maxAttendees) * 100)}%
                                  </p>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="text-sm font-medium text-slate-800">${event.ticketPrice}</p>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  event.status === 'active' ? 'bg-green-100 text-green-800' :
                                  event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                  event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {event.status}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setEditingEvent(event)}
                                    disabled={deleteEventMutation.isPending}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteEvent(event)}
                                    disabled={deleteEventMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <h3 className="text-lg font-medium text-slate-800 mb-2">No events yet</h3>
                      <p className="text-slate-600 mb-4">Create your first event to get started</p>
                      <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-primary-500 hover:bg-primary-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </main>
        )}

        {/* Attendees Tab */}
        {activeTab === "attendees" && (
          <main className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Attendee Management</h2>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={exportAttendees}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <SendNotificationModal />
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <AttendeesTable />
              </CardContent>
            </Card>
          </main>
        )}

        {/* Tickets Tab */}
        {activeTab === "tickets" && (
          <main className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Ticket Management</h2>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={exportTickets}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Tickets
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <TicketsTable />
              </CardContent>
            </Card>
          </main>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <main className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Analytics & Reports</h2>
              <div className="flex space-x-3">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Most Popular Event</span>
                      <span className="font-semibold">Tech Conference 2024</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Average Attendance Rate</span>
                      <span className="font-semibold">78%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Revenue Growth</span>
                      <span className="font-semibold text-green-600">+15%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Events This Month</span>
                      <span className="font-semibold">{events?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">New Registrations</span>
                      <span className="font-semibold">{stats?.totalAttendees || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Revenue This Month</span>
                      <span className="font-semibold">${stats?.totalRevenue?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
      
      {editingEvent && (
        <EditEventModal 
          isOpen={!!editingEvent} 
          onClose={() => setEditingEvent(null)} 
          event={editingEvent}
        />
      )}
    </div>
  );
}
