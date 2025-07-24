import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import AdminSidebar from "@/components/admin-sidebar";
import CreateEventModal from "@/components/create-event-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, DollarSign, TrendingUp, Plus, Download, Mail, BarChart3, CalendarDays, Filter, ArrowUpDown } from "lucide-react";

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
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">View</Button>
                    {booking.status === 'pending' && (
                      <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50">
                        Confirm
                      </Button>
                    )}
                  </div>
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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Event filtering and sorting states
  const [dateFilterFrom, setDateFilterFrom] = useState("");
  const [dateFilterTo, setDateFilterTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

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
  const { data: rawEvents } = useQuery({
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

  // Auto-set date range when filtering
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

            {/* Filters and Controls */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Date Range Filter */}
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-slate-600" />
                    <label className="text-sm font-medium text-slate-700">From:</label>
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

                  {/* Sort Controls */}
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-slate-600" />
                    <label className="text-sm font-medium text-slate-700">Sort by:</label>
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
                                <p className="text-sm text-slate-800">
                                  {event.currentAttendees || 0} / {event.maxAttendees}
                                </p>
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
                                  <Button size="sm" variant="outline">Edit</Button>
                                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
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
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
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
                <Button variant="outline">
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
    </div>
  );
}
