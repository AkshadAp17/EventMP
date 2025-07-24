import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Calendar, Shield, Zap } from "lucide-react";

export default function AuthChoice() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-glow animate-pulse-slow">
              <Calendar className="text-primary-foreground h-7 w-7" />
            </div>
            <h1 className="text-3xl font-display font-bold gradient-text">EventMaster</h1>
          </div>
          <p className="text-muted-foreground text-lg">Choose your sign-in method</p>
        </div>

        <div className="space-y-4">
          {/* Auth0 Login */}
          <Card className="card-gradient border-2 hover:border-primary/50 transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Professional Sign In</CardTitle>
              <CardDescription>
                Sign in with Google, GitHub, or email using secure Auth0 authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl transition-all duration-300 hover:scale-105 shadow-glow"
                onClick={() => window.location.href = '/auth/login'}
              >
                <Shield className="mr-2 h-5 w-5" />
                Continue with Auth0
              </Button>
            </CardContent>
          </Card>

          {/* Local Login */}
          <Card className="card-gradient border-2 hover:border-accent/50 transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-xl">Quick Access</CardTitle>
              <CardDescription>
                Use the demo account or create a local account for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline"
                className="w-full h-12 border-2 hover:bg-accent/20 rounded-xl transition-all duration-300 hover:scale-105"
                onClick={() => window.location.href = '/auth'}
              >
                <LogIn className="mr-2 h-5 w-5" />
                Local Sign In
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            New to EventMaster?{" "}
            <a href="/signup" className="text-primary hover:underline font-medium">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}