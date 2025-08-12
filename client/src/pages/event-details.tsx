import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, ArrowLeft, Ticket } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ticketQuantity, setTicketQuantity] = useState(1);
  
  // Define authentication state
  const isAuthenticated = !!user;

  const { data: event, isLoading } = useQuery({
    queryKey: ["/api/events", id],
    enabled: !!id,
    retry: false,
  });
  
  // Type guard for event
  const eventData = event as any;

  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: (booking) => {
      toast({
        title: "Booking Confirmed!",
        description: `Your booking reference is ${booking.bookingReference}. Email confirmation sent!`,
      });
      
      // Invalidate cache to refresh event data and attendee counts
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      // Navigate to checkout using MongoDB ObjectId
      const bookingId = booking._id || booking.id;
      console.log('Redirecting to checkout with booking ID:', bookingId);
      window.location.href = `/checkout/${bookingId}`;
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Please sign in",
          description: "You need to sign in to book tickets.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const handleBookTickets = () => {
    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to book tickets.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
      return;
    }

    if (!eventData) return;

    const totalAmount = parseFloat(eventData.ticketPrice) * ticketQuantity;
    
    bookingMutation.mutate({
      eventId: eventData.id,
      quantity: ticketQuantity,
      totalAmount: totalAmount.toString(),
      status: "pending",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-800 mb-4">Event Not Found</h1>
              <p className="text-slate-600 mb-4">The event you're looking for doesn't exist.</p>
              <Button onClick={() => window.location.href = "/events"}>
                Back to Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableTickets = eventData.maxAttendees - eventData.currentAttendees;
  const isEventFull = availableTickets <= 0;
  const isEventPast = new Date(eventData.endDate) < new Date();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Calendar className="text-white h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">EventMaster</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-slate-700">
                  {user.firstName} {user.lastName}
                </span>
                <Button 
                  size="sm"
                  onClick={() => window.location.href = "/api/logout"}
                  variant="outline"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button onClick={() => window.location.href = '/auth-choice'}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <div className="aspect-video rounded-2xl overflow-hidden">
              <img 
                src={eventData.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"}
                alt={eventData.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Event Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl font-bold text-slate-800 mb-2">
                      {eventData.name}
                    </CardTitle>
                    <Badge variant="secondary" className="mb-4">
                      {eventData.category}
                    </Badge>
                  </div>
                  <Badge 
                    variant={eventData.status === 'active' ? 'default' : 'secondary'}
                    className={
                      eventData.status === 'active' ? 'bg-green-100 text-green-800' :
                      eventData.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                      eventData.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {eventData.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg text-slate-600 leading-relaxed">
                  {eventData.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-800">Start Date</p>
                      <p className="text-slate-600">
                        {new Date(eventData.startDate).toLocaleDateString()} at{" "}
                        {new Date(eventData.startDate).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-800">End Date</p>
                      <p className="text-slate-600">
                        {new Date(eventData.endDate).toLocaleDateString()} at{" "}
                        {new Date(eventData.endDate).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-800">Location</p>
                      <p className="text-slate-600">{eventData.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-800">Capacity</p>
                      <p className="text-slate-600">
                        {eventData.currentAttendees} / {eventData.maxAttendees} attendees
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Card */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Ticket className="h-5 w-5" />
                  <span>Book Tickets</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-800">
                    ${parseFloat(eventData.ticketPrice).toFixed(2)}
                  </p>
                  <p className="text-slate-600">per ticket</p>
                </div>

                {!isEventPast && !isEventFull && eventData.status !== 'draft' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Number of Tickets</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={Math.min(10, availableTickets)}
                        value={ticketQuantity}
                        onChange={(e) => setTicketQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                      <p className="text-sm text-slate-500">
                        {availableTickets} tickets available
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span>${(parseFloat(eventData.ticketPrice) * ticketQuantity).toFixed(2)}</span>
                      </div>
                    </div>

                    <Button 
                      onClick={handleBookTickets}
                      disabled={bookingMutation.isPending}
                      className="w-full bg-primary-500 hover:bg-primary-600"
                      size="lg"
                    >
                      {bookingMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Processing...
                        </>
                      ) : (
                        "Book Now"
                      )}
                    </Button>

                    {!isAuthenticated && (
                      <p className="text-sm text-slate-500 text-center">
                        You'll be asked to sign in before completing your booking
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    {isEventPast ? (
                      <p className="text-slate-600">This event has ended</p>
                    ) : isEventFull ? (
                      <p className="text-slate-600">This event is sold out</p>
                    ) : eventData.status === 'draft' ? (
                      <p className="text-slate-600">This event is not yet available for booking</p>
                    ) : (
                      <p className="text-slate-600">Booking is not available</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Event Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tickets Sold</span>
                    <span className="font-medium">{eventData.currentAttendees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Available</span>
                    <span className="font-medium">{availableTickets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Capacity</span>
                    <span className="font-medium">{eventData.maxAttendees}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full" 
                      style={{ width: `${(eventData.currentAttendees / eventData.maxAttendees) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
