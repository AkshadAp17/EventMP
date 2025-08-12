import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, ArrowLeft } from "lucide-react";

export default function MyTickets() {
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-muted-foreground mb-6">You need to sign in to view your tickets.</p>
          <Button onClick={() => window.location.href = '/auth-choice'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-4xl font-bold gradient-text mb-2">My Tickets</h1>
          <p className="text-muted-foreground">View all your event bookings and tickets</p>
        </div>

        {isLoading ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookings && Array.isArray(bookings) && bookings.length > 0 ? (
          <div className="grid gap-6">
            {bookings.map((booking: any) => (
              <Card key={booking.id} className="glass-effect">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Event Image */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {booking.event?.imageUrl ? (
                        <img 
                          src={booking.event.imageUrl} 
                          alt={booking.event.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{booking.event?.name}</h3>
                          <div className="flex items-center text-muted-foreground text-sm mb-2">
                            <Calendar className="w-4 h-4 mr-2" />
                            {booking.event?.startDate 
                              ? (() => {
                                  const startDate = new Date(booking.event.startDate);
                                  const endDate = booking.event.endDate ? new Date(booking.event.endDate) : null;
                                  
                                  if (endDate && startDate.toDateString() !== endDate.toDateString()) {
                                    return `${startDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })} - ${endDate.toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}`;
                                  } else {
                                    return startDate.toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    });
                                  }
                                })()
                              : 'Event Date TBD'
                            }
                          </div>
                          <div className="flex items-center text-muted-foreground text-sm">
                            <MapPin className="w-4 h-4 mr-2" />
                            {booking.event?.location || 'Location TBD'}
                          </div>
                        </div>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tickets</p>
                        <p className="font-semibold">{booking.quantity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Paid</p>
                        <p className="font-semibold">${booking.totalAmount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reference</p>
                        <p className="font-semibold font-mono">{booking.bookingReference || booking.referenceCode}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Booked On</p>
                        <p className="font-semibold">
                          {booking.createdAt 
                            ? new Date(booking.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
            <h3 className="text-2xl font-semibold mb-4">No tickets yet</h3>
            <p className="text-muted-foreground mb-8">
              You haven't booked any events yet. Discover amazing tech events and get your tickets!
            </p>
            <Button onClick={() => window.location.href = '/events'}>
              Browse Events
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}