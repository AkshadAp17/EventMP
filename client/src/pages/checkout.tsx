import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Calendar, MapPin, Users } from "lucide-react";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 
  loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) : null;

function CheckoutForm({ booking }: { booking: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/events/${booking.event?.id || ""}?booking=${booking.bookingReference || ""}`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Your tickets have been booked successfully!",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-slate-200 rounded-lg">
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-primary-500 hover:bg-primary-600"
        size="lg"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay ${parseFloat(booking.totalAmount || "0").toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const { bookingId } = useParams();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");

  const { data: booking, isLoading } = useQuery({
    queryKey: ["/api/bookings", bookingId],
    enabled: !!bookingId,
    retry: false,
  });

  // If booking data is not available, return empty object to prevent errors
  const safeBooking = booking || {};

  useEffect(() => {
    if (!booking) return;

    // Create PaymentIntent
    apiRequest("POST", "/api/create-payment-intent", { 
      amount: parseFloat(safeBooking.totalAmount || "0"),
      bookingId: safeBooking.id || bookingId
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          toast({
            title: "Payment Setup Failed",
            description: "Unable to initialize payment. Please try again.",
            variant: "destructive",
          });
        }
      })
      .catch((error) => {
        console.error("Payment setup error:", error);
        toast({
          title: "Payment Setup Failed",
          description: "Payment processing is not available at the moment.",
          variant: "destructive",
        });
      });
  }, [booking, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-800 mb-4">Booking Not Found</h1>
              <p className="text-slate-600 mb-4">The booking you're looking for doesn't exist.</p>
              <Button onClick={() => window.location.href = "/events"}>
                Back to Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-slate-800">EventMaster - Checkout</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <img 
                    src={safeBooking.event?.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=100"}
                    alt={safeBooking.event?.name || "Event"}
                    className="w-20 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{safeBooking.event?.name || "Loading..."}</h3>
                    <p className="text-sm text-slate-600">{safeBooking.event?.category || ""}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">
                      {safeBooking.event?.startDate ? new Date(safeBooking.event.startDate).toLocaleDateString() : "Date TBD"} at{" "}
                      {safeBooking.event?.startDate ? new Date(safeBooking.event.startDate).toLocaleTimeString() : "Time TBD"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{safeBooking.event?.location || "Location TBD"}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-sm">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{safeBooking.quantity || 0} ticket(s)</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Booking Reference</span>
                    <span className="font-medium">{safeBooking.bookingReference || "Loading..."}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Attendee Name</span>
                    <span className="font-medium">{safeBooking.attendeeName || "Loading..."}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Email</span>
                    <span className="font-medium">{safeBooking.attendeeEmail || "Loading..."}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Ticket Price</span>
                    <span>${parseFloat(safeBooking.event?.ticketPrice || "0").toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Quantity</span>
                    <span>{safeBooking.quantity || 0}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total</span>
                    <span>${parseFloat(safeBooking.totalAmount || "0").toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Booking Confirmed!</h3>
                  <p className="text-slate-600 mb-4">
                    Your booking has been automatically confirmed. A confirmation email has been sent to your email address.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 text-sm">
                      <strong>Confirmation sent to:</strong> {safeBooking.attendeeEmail || "Loading..."}
                    </p>
                    <p className="text-green-800 text-sm mt-1">
                      <strong>Booking Reference:</strong> {safeBooking.bookingReference || "Loading..."}
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={() => window.location.href = `/my-tickets`}
                      className="bg-primary hover:bg-primary/90"
                    >
                      View My Tickets
                    </Button>
                    <Button 
                      onClick={() => window.location.href = `/events`}
                      variant="outline"
                    >
                      Browse Events
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-slate-500 text-center">
              <p>Your booking is confirmed automatically. Payment arrangements will be handled separately via email.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
