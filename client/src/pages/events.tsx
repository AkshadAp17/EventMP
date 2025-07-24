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
              {user && <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">My Tickets</a>}
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
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
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative hover:bg-accent/20 rounded-xl">
                      <Bell className="h-5 w-5" />
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-primary text-primary-foreground">
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
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="bg-primary hover:bg-primary/90 rounded-xl px-6 py-2 transition-all duration-300 hover:scale-105 shadow-glow"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10"></div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center">
            <div className="animate-float">
              <h1 className="text-5xl md:text-6xl font-display font-bold gradient-text mb-8 leading-tight">
                Technology Events
                <br />
                <span className="text-foreground">That Matter</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto font-light leading-relaxed">
              Discover cutting-edge tech conferences, workshops, and meetups. Stay ahead with the latest in AI, web development, cloud computing, and more.
            </p>
            
            {/* Quick Tech Categories */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { name: 'AI & ML', icon: '🤖', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
                { name: 'Web Dev', icon: '🌐', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
                { name: 'Cloud', icon: '☁️', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
                { name: 'Mobile', icon: '📱', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
                { name: 'Security', icon: '🔒', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
              ].map((tech) => (
                <div key={tech.name} className={`${tech.color} px-4 py-2 rounded-xl text-sm font-medium cursor-pointer hover:scale-105 transition-all duration-200`}>
                  <span className="mr-2">{tech.icon}</span>
                  {tech.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Filters */}
      <section className="py-8 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="card-gradient rounded-2xl p-6 border border-border/50">
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-52 h-11 rounded-xl border-2 focus:border-primary/50">
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
                <SelectTrigger className="w-52 h-11 rounded-xl border-2 focus:border-primary/50">
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
                className="h-11 rounded-xl border-2 hover:bg-accent/20 transition-all duration-200"
              >
                Clear Filters
              </Button>
              
              {/* Event Count Badge */}
              <div className="ml-auto">
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  {events?.length || 0} Events Found
                </Badge>
              </div>
            </div>
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
