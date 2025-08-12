import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, DollarSign, Clock } from "lucide-react";

interface EventCardProps {
  event: {
    id: number;
    name: string;
    description: string;
    category: string;
    startDate: string;
    endDate: string;
    location: string;
    ticketPrice: string;
    maxAttendees: number;
    currentAttendees: number;
    status: string;
    imageUrl?: string;
  };
}

export default function EventCard({ event }: EventCardProps) {
  const handleViewDetails = () => {
    window.location.href = `/events/${event.id}`;
  };

  const handleBookTicket = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/events/${event.id}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'conference':
        return 'bg-blue-100 text-blue-800';
      case 'workshop':
        return 'bg-purple-100 text-purple-800';
      case 'festival':
        return 'bg-green-100 text-green-800';
      case 'meetup':
        return 'bg-orange-100 text-orange-800';
      case 'seminar':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isEventFull = event.currentAttendees >= event.maxAttendees;
  const isEventPast = new Date(event.endDate) < new Date();

  return (
    <Card 
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
      onClick={handleViewDetails}
    >
      <div className="aspect-video w-full overflow-hidden">
        <img 
          src={event.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250"}
          alt={event.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge className={getCategoryColor(event.category)}>
            {event.category}
          </Badge>
          <span className="text-slate-500 text-sm">
            {new Date(event.startDate).toLocaleDateString()}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">
          {event.name}
        </h3>
        
        <p className="text-slate-600 mb-4 line-clamp-2">
          {event.description}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-slate-500 text-sm">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(event.startDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
              {new Date(event.startDate).toLocaleDateString() !== new Date(event.endDate).toLocaleDateString() && 
                ` - ${new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              }
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-slate-500 text-sm">
            <Clock className="h-4 w-4" />
            <span>
              {new Date(event.startDate).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
              {new Date(event.startDate).toLocaleDateString() === new Date(event.endDate).toLocaleDateString() &&
                ` - ${new Date(event.endDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
              }
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-slate-500 text-sm">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{event.location}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-slate-500 text-sm">
            <Users className="h-4 w-4" />
            <span className="font-medium text-slate-700">{event.currentAttendees}</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-400">{event.maxAttendees} attending</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-slate-500">Starting from</p>
              <p className="text-lg font-bold text-primary-600">
                ${parseFloat(event.ticketPrice).toFixed(2)}
              </p>
            </div>
            
            <Badge className={getStatusColor(event.status)}>
              {event.status}
            </Badge>
          </div>
        </div>
        
        <Button 
          onClick={handleBookTicket}
          disabled={isEventFull || isEventPast || event.status === 'draft'}
          className="w-full mt-4 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-300"
        >
          {isEventPast ? "Event Ended" :
           isEventFull ? "Sold Out" :
           event.status === 'draft' ? "Coming Soon" :
           "Book Tickets"}
        </Button>
      </CardContent>
    </Card>
  );
}
