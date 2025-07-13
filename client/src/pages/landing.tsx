import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Search, Users, Star, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Calendar className="text-white h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">EventMaster</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary-500 hover:bg-primary-600"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-slate-800 mb-6">
            Discover Amazing Events
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            From conferences to concerts, find and book tickets for the best events in your area.
          </p>
          
          {/* Event Search */}
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">What</label>
                <Input placeholder="Event name or keyword" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Where</label>
                <Input placeholder="City or venue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">When</label>
                <Input type="date" />
              </div>
              <div className="flex items-end">
                <Button className="w-full bg-primary-500 hover:bg-primary-600">
                  <Search className="w-4 h-4 mr-2" />
                  Search Events
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Why Choose EventMaster?</h2>
            <p className="text-lg text-slate-600">Everything you need for seamless event discovery and booking</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Easy Discovery</h3>
              <p className="text-slate-600">Find events that match your interests with our powerful search and filtering tools.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Instant Booking</h3>
              <p className="text-slate-600">Book your tickets instantly with our secure and fast checkout process.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Community</h3>
              <p className="text-slate-600">Join a community of event enthusiasts and discover new experiences.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Popular Categories</h2>
            <p className="text-lg text-slate-600">Explore events by category</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: "Business", icon: "💼" },
              { name: "Music", icon: "🎵" },
              { name: "Technology", icon: "💻" },
              { name: "Health", icon: "❤️" },
              { name: "Arts", icon: "🎨" },
              { name: "Gaming", icon: "🎮" },
            ].map((category) => (
              <div
                key={category.name}
                className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="text-3xl mb-3">{category.icon}</div>
                <h3 className="font-semibold text-slate-800">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-500">
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
