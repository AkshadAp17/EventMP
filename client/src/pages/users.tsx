import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Search, Calendar, Mail, User, Filter, Download } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function UsersPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
    retry: false,
  });

  // Filter users based on search and role
  const filteredUsers = users?.filter((u: any) => {
    const matchesSearch = !searchQuery || 
      u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || 
      (roleFilter === "admin" && u.isAdmin) ||
      (roleFilter === "user" && !u.isAdmin);
    
    return matchesSearch && matchesRole;
  }) || [];

  // Get user booking statistics
  const getUserStats = (userId: string) => {
    if (!bookings) return { totalBookings: 0, totalSpent: 0, lastBooking: null };
    
    const userBookings = bookings.filter((b: any) => b.userId === userId);
    const totalBookings = userBookings.length;
    const totalSpent = userBookings.reduce((sum: number, b: any) => sum + parseFloat(b.totalAmount || 0), 0);
    const lastBooking = userBookings.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    return { totalBookings, totalSpent, lastBooking };
  };

  const exportUsers = async () => {
    try {
      const response = await fetch('/api/export/users', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users-export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (usersLoading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <p className="text-red-600">Error loading users. Please check your permissions.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              User Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage registered users and view their activity
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={exportUsers} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Users
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={roleFilter === "all" ? "default" : "outline"}
                  onClick={() => setRoleFilter("all")}
                  size="sm"
                >
                  All Users
                </Button>
                <Button
                  variant={roleFilter === "admin" ? "default" : "outline"}
                  onClick={() => setRoleFilter("admin")}
                  size="sm"
                >
                  Admins
                </Button>
                <Button
                  variant={roleFilter === "user" ? "default" : "outline"}
                  onClick={() => setRoleFilter("user")}
                  size="sm"
                >
                  Users
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{users?.length || 0}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                  <p className="text-2xl font-bold text-foreground">
                    {users?.filter((u: any) => u.isAdmin).length || 0}
                  </p>
                </div>
                <User className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings?.filter((b: any) => b.status === 'confirmed').length || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${bookings?.reduce((sum: number, b: any) => sum + parseFloat(b.totalAmount || 0), 0).toFixed(2) || '0.00'}
                  </p>
                </div>
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-4 font-semibold text-slate-700">User</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Email</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Role</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Bookings</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Total Spent</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Last Activity</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((userItem: any) => {
                      const stats = getUserStats(userItem.id);
                      return (
                        <tr key={userItem.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  {(userItem.firstName?.[0] || '') + (userItem.lastName?.[0] || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-slate-800">
                                  {userItem.firstName} {userItem.lastName}
                                </p>
                                <p className="text-sm text-slate-500">ID: {userItem.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-slate-800">{userItem.email}</p>
                          </td>
                          <td className="p-4">
                            <Badge variant={userItem.isAdmin ? "default" : "secondary"}>
                              {userItem.isAdmin ? "Admin" : "User"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-slate-800">{stats.totalBookings}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-green-600">${stats.totalSpent.toFixed(2)}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-slate-600">
                              {stats.lastBooking 
                                ? format(new Date(stats.lastBooking.createdAt), 'MMM dd, yyyy')
                                : 'No activity'
                              }
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="text-slate-600">
                              {userItem.createdAt 
                                ? format(new Date(userItem.createdAt), 'MMM dd, yyyy')
                                : 'Unknown'
                              }
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">No users found</h3>
                <p className="text-slate-600">
                  {searchQuery ? "Try adjusting your search criteria" : "No users are registered yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}