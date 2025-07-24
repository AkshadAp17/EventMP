import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Users, Globe, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/events'}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
          <h1 className="text-4xl font-bold gradient-text mb-2">About EventMaster</h1>
          <p className="text-muted-foreground text-lg">Connecting the tech community through amazing events</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Mission Section */}
          <Card className="glass-effect">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Calendar className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-lg text-muted-foreground">
                  EventMaster is dedicated to bringing together technology professionals, enthusiasts, 
                  and learners through carefully curated events that inspire, educate, and connect.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Tech Community</h3>
                <p className="text-muted-foreground">
                  Connect with like-minded developers, engineers, and tech professionals from around the world.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Global Events</h3>
                <p className="text-muted-foreground">
                  Discover conferences, workshops, meetups, and hackathons happening worldwide.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Passion Driven</h3>
                <p className="text-muted-foreground">
                  Built by developers for developers, with a focus on creating meaningful experiences.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Story Section */}
          <Card className="glass-effect">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  EventMaster was born from a simple observation: the tech community thrives when people 
                  come together to share knowledge, collaborate on projects, and inspire each other. 
                  However, finding quality tech events was often difficult and fragmented across 
                  multiple platforms.
                </p>
                <p>
                  We created EventMaster to be the central hub for technology events, making it easy 
                  for organizers to reach their audience and for attendees to discover events that 
                  match their interests and skill levels.
                </p>
                <p>
                  Whether you're a seasoned software architect looking for the latest in cloud computing, 
                  a startup founder interested in AI breakthroughs, or a student wanting to learn 
                  web development, EventMaster helps you find your place in the tech community.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Values Section */}
          <Card className="glass-effect">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">🌟 Quality First</h3>
                  <p className="text-muted-foreground">
                    We carefully curate events to ensure high-quality experiences for all attendees.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">🤝 Community Focused</h3>
                  <p className="text-muted-foreground">
                    Building connections and fostering collaboration within the tech community.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">🚀 Innovation Driven</h3>
                  <p className="text-muted-foreground">
                    Constantly improving our platform to better serve organizers and attendees.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">💡 Learning Oriented</h3>
                  <p className="text-muted-foreground">
                    Promoting continuous learning and professional development through events.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="glass-effect border-primary/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Join the Community</h2>
              <p className="text-muted-foreground mb-6">
                Ready to discover amazing tech events and connect with the community?
              </p>
              <Button 
                onClick={() => window.location.href = '/events'}
                className="bg-primary hover:bg-primary/90"
                size="lg"
              >
                Explore Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}