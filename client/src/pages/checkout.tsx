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
        return_url: `${window.location.origin}/events/${booking.event.id}?booking=${booking.bookingReference}`,
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
            Pay ${parseFloat(booking.totalAmount).toFixed(2)}
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

  useEffect(() => {
    if (!booking) return;

    // Create PaymentIntent
    apiRequest("POST", "/api/create-payment-intent", { 
      amount: parseFloat(booking.totalAmount),
      bookingId: booking.id
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
                    src={booking.event.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=100"}
                    alt={booking.event.name}
                    className="w-20 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{booking.event.name}</h3>
                    <p className="text-sm text-slate-600">{booking.event.category}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">
                      {new Date(booking.event.startDate).toLocaleDateString()} at{" "}
                      {new Date(booking.event.startDate).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{booking.event.location}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-sm">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{booking.quantity} ticket(s)</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Booking Reference</span>
                    <span className="font-medium">{booking.bookingReference}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Attendee Name</span>
                    <span className="font-medium">{booking.attendeeName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Email</span>
                    <span className="font-medium">{booking.attendeeEmail}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Ticket Price</span>
                    <span>${parseFloat(booking.event.ticketPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Quantity</span>
                    <span>{booking.quantity}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total</span>
                    <span>${parseFloat(booking.totalAmount).toFixed(2)}</span>
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
                {!stripePromise ? (
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Payment Unavailable</h3>
                    <p className="text-slate-600 mb-4">
                      Payment processing is not configured. Please contact support.
                    </p>
                    <Button 
                      onClick={() => window.location.href = `/events/${booking.event.id}`}
                      variant="outline"
                    >
                      Back to Event
                    </Button>
                  </div>
                ) : !clientSecret ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-slate-600">Setting up payment...</p>
                  </div>
                ) : (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm booking={booking} />
                  </Elements>
                )}
              </CardContent>
            </Card>

            <div className="text-xs text-slate-500 text-center">
              <p>Your payment is secured by Stripe. We never store your payment information.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
