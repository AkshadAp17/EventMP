import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import EventCard from "@/components/event-card";
import { Calendar, MapPin, Search, User, Bell, Settings, LogOut, Shield, MoreVertical } from "lucide-react";

export default function Events() {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/events", { 
      search: searchQuery || undefined, 
      category: selectedCategory === "all" ? undefined : selectedCategory, 
      status: selectedStatus === "all" ? undefined : selectedStatus 
    }],
    retry: false,
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "conference", label: "Conference" },
    { value: "workshop", label: "Workshop" },
    { value: "festival", label: "Festival" },
    { value: "meetup", label: "Meetup" },
    { value: "seminar", label: "Seminar" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Calendar className="text-white h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">EventMaster</h1>
            </div>
            <div className="hidden md:flex space-x-6">
              <a href="/events" className="text-primary-600 font-medium">Events</a>
              {user && <a href="#" className="text-slate-600 hover:text-slate-800">My Tickets</a>}
              <a href="#" className="text-slate-600 hover:text-slate-800">About</a>
              <a href="#" className="text-slate-600 hover:text-slate-800">Contact</a>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input 
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            </div>
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="h-5 w-5" />
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs">
                        3
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">Event Registration Confirmed</p>
                        <p className="text-xs text-slate-500">Your booking for "Tech Conference 2024" has been confirmed</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">New Event Available</p>
                        <p className="text-xs text-slate-500">Check out the new workshop happening this weekend</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">Event Reminder</p>
                        <p className="text-xs text-slate-500">Your event starts in 2 hours</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Profile Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 hover:bg-slate-100">
                      <img 
                        src={user.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName} ${user.lastName}`}
                        alt="User Avatar" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-slate-700 hidden md:block">
                        {user.firstName} {user.lastName}
                      </span>
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem>
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>My Tickets</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    
                    {user.isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.location.href = "/admin"}>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                      className="text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{logoutMutation.isPending ? "Signing out..." : "Sign Out"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button onClick={() => window.location.href = '/auth'}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-slate-800 mb-6">Discover Amazing Events</h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              From conferences to concerts, find and book tickets for the best events in your area.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStatus("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-slate-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-6 bg-slate-200 rounded mb-4"></div>
                    <div className="h-16 bg-slate-200 rounded mb-4"></div>
                    <div className="h-10 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Calendar className="mx-auto h-16 w-16 text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No events found</h3>
              <p className="text-slate-600 mb-6">
                {searchQuery || selectedCategory || selectedStatus 
                  ? "Try adjusting your search criteria or filters."
                  : "Check back soon for new events!"}
              </p>
              {(searchQuery || selectedCategory || selectedStatus) && (
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                    setSelectedStatus("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Browse by Category</h2>
            <p className="text-lg text-slate-600">Find events that match your interests</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: "Business", icon: "💼", category: "conference" },
              { name: "Music", icon: "🎵", category: "festival" },
              { name: "Technology", icon: "💻", category: "conference" },
              { name: "Health", icon: "❤️", category: "workshop" },
              { name: "Arts", icon: "🎨", category: "workshop" },
              { name: "Gaming", icon: "🎮", category: "meetup" },
            ].map((item) => (
              <div
                key={item.name}
                onClick={() => setSelectedCategory(item.category)}
                className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-slate-800">{item.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
