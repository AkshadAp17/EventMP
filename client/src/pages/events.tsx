import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import EventCard from "@/components/event-card";
import { NotificationBell } from "@/components/notification-center";
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
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== "all") params.append('category', selectedCategory);
      if (selectedStatus !== "all") params.append('status', selectedStatus);
      
      const url = `/api/events${params.toString() ? '?' + params.toString() : ''}`;
      return fetch(url).then(res => res.json());
    },
    retry: false,
  });

  const categories = [
    { value: "all", label: "All Tech Events" },
    { value: "conference", label: "Tech Conference" },
    { value: "workshop", label: "Coding Workshop" },
    { value: "meetup", label: "Developer Meetup" },
    { value: "seminar", label: "Tech Seminar" },
    { value: "hackathon", label: "Hackathon" },
    { value: "webinar", label: "Online Webinar" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* Navigation */}
      <nav className="glass-effect sticky top-0 z-50 border-b border-border/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-glow animate-pulse-slow">
                <Calendar className="text-primary-foreground h-6 w-6" />
              </div>
              <h1 className="text-2xl font-display font-bold gradient-text">EventMaster</h1>
            </div>
            <div className="hidden md:flex space-x-6">
              <a href="/events" className="text-primary font-semibold">Events</a>
              {user && <a href="/my-tickets" className="text-muted-foreground hover:text-foreground transition-colors">My Tickets</a>}
              <a href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
              <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input 
                placeholder="Search technology events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-72 h-11 rounded-xl border-2 focus:border-primary/50 transition-all"
              />
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            </div>
            
            {user ? (
              <div className="flex items-center space-x-3">
                <NotificationBell />

                {/* User Profile Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 hover:bg-accent/20 rounded-xl">
                      <img 
                        src={user.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName} ${user.lastName}`} 
                        alt="User Avatar" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = '/my-tickets'}>
                      <Calendar className="mr-2 h-4 w-4" />
                      My Tickets
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button 
                onClick={() => window.location.href = '/auth-choice'}
                className="bg-primary hover:bg-primary/90 rounded-xl px-6 py-2 transition-all duration-300 hover:scale-105 shadow-glow"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-6">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" />
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <MapPin className="w-4 h-4 mr-2" />
            Discover Technology Events Near You
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold gradient-text mb-6 animate-slide-up">
            Find Your Next Tech Adventure
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-slide-up animation-delay-200">
            Connect with the tech community through conferences, workshops, meetups, and hackathons. 
            Expand your knowledge, network with professionals, and stay ahead in technology.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
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
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStatus("all");
              }}
              className="w-full sm:w-auto"
            >
              Clear All
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            {events ? `${events.length} events found` : 'Loading events...'}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-card rounded-xl h-64 border"></div>
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
              <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
              <h3 className="text-2xl font-semibold text-foreground mb-4">No events found</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {searchQuery || selectedCategory !== "all" || selectedStatus !== "all" 
                  ? "Try adjusting your search criteria or filters."
                  : "Be the first to discover amazing tech events in your area."
                }
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                }}
                className="bg-primary hover:bg-primary/90"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Popular Categories */}
      <section className="px-6 py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-4">Popular Tech Categories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore events by category and discover new areas of technology
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(1).map((category) => (
              <Button
                key={category.value}
                variant="outline"
                className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-primary/5 hover:border-primary/20 transition-all"
                onClick={() => setSelectedCategory(category.value)}
              >
                <Calendar className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium text-center">{category.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}