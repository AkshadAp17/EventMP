import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Search, Users, Star, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-primary/10">
      {/* Navigation */}
      <nav className="glass-effect sticky top-0 z-50 border-b border-border/50 px-4 lg:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="w-8 lg:w-10 h-8 lg:h-10 bg-primary rounded-xl flex items-center justify-center shadow-glow animate-pulse-slow">
              <Calendar className="text-primary-foreground h-4 lg:h-6 w-4 lg:w-6" />
            </div>
            <h1 className="text-lg lg:text-2xl font-display font-bold gradient-text">EventMaster</h1>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-4">
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="bg-primary hover:bg-primary/90 shadow-glow transition-all duration-300 hover:scale-105 text-sm lg:text-base px-3 lg:px-4"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"></div>
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center relative">
          <div className="animate-float">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold gradient-text mb-6 lg:mb-8 leading-tight">
              Discover Amazing
              <br />
              <span className="text-foreground">Events</span>
            </h1>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 lg:mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            From conferences to concerts, find and book tickets for the best events in your area with our premium platform.
          </p>
          
          {/* Event Search */}
          <div className="card-gradient rounded-2xl lg:rounded-3xl shadow-2xl p-4 lg:p-8 max-w-5xl mx-auto border border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-foreground mb-2 lg:mb-3">What</label>
                <Input 
                  placeholder="Event name or keyword" 
                  className="h-10 lg:h-12 rounded-xl border-2 focus:border-primary/50 transition-all text-sm lg:text-base"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-foreground mb-2 lg:mb-3">Where</label>
                <Input 
                  placeholder="City or venue" 
                  className="h-10 lg:h-12 rounded-xl border-2 focus:border-primary/50 transition-all text-sm lg:text-base"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-semibold text-foreground mb-2 lg:mb-3">When</label>
                <Input 
                  type="date" 
                  className="h-10 lg:h-12 rounded-xl border-2 focus:border-primary/50 transition-all text-sm lg:text-base"
                />
              </div>
              <div className="flex items-end sm:col-span-1">
                <Button 
                  onClick={() => window.location.href = '/events'}
                  className="w-full h-10 lg:h-12 rounded-xl bg-primary hover:bg-primary/90 font-semibold transition-all duration-300 hover:scale-105 shadow-glow text-sm lg:text-base"
                >
                  <Search className="w-4 lg:w-5 h-4 lg:h-5 mr-2" />
                  <span className="hidden sm:inline">Search Events</span>
                  <span className="sm:hidden">Search</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold gradient-text mb-4 lg:mb-6">Why Choose EventMaster?</h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">Everything you need for seamless event discovery and booking</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110 shadow-glow">
                <Search className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-display font-semibold text-foreground mb-4">Easy Discovery</h3>
              <p className="text-muted-foreground leading-relaxed">Find events that match your interests with our powerful search and filtering tools.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:bg-accent/30 group-hover:scale-110">
                <Clock className="w-10 h-10 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-display font-semibold text-foreground mb-4">Instant Booking</h3>
              <p className="text-muted-foreground leading-relaxed">Book your tickets instantly with our secure email-based confirmation process.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:bg-secondary/70 group-hover:scale-110">
                <Users className="w-10 h-10 text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-display font-semibold text-foreground mb-4">Community</h3>
              <p className="text-muted-foreground leading-relaxed">Join a community of event enthusiasts and discover new experiences.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold gradient-text mb-6">Popular Categories</h2>
            <p className="text-xl text-muted-foreground">Explore events by category</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: "Business", icon: "💼", color: "bg-blue-50 hover:bg-blue-100" },
              { name: "Music", icon: "🎵", color: "bg-purple-50 hover:bg-purple-100" },
              { name: "Technology", icon: "💻", color: "bg-green-50 hover:bg-green-100" },
              { name: "Health", icon: "❤️", color: "bg-red-50 hover:bg-red-100" },
              { name: "Arts", icon: "🎨", color: "bg-yellow-50 hover:bg-yellow-100" },
              { name: "Gaming", icon: "🎮", color: "bg-indigo-50 hover:bg-indigo-100" },
            ].map((category) => (
              <div
                key={category.name}
                className={`${category.color} dark:bg-card rounded-2xl shadow-sm p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border border-border/50`}
              >
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="font-semibold text-foreground">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90">Join thousands of event enthusiasts and start discovering amazing experiences.</p>
          <Button 
            onClick={() => window.location.href = '/events'}
            className="bg-background text-foreground hover:bg-background/90 px-8 py-4 text-lg rounded-xl shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Explore Events Now
          </Button>
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Discover Events?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust EventMaster for their event needs.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-white text-primary-500 hover:bg-gray-100"
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Calendar className="text-white h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold">EventMaster</h3>
            </div>
            <p className="text-slate-400 mb-6">The ultimate event management platform</p>
            <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
