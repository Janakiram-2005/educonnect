import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// 1. ADD YOUR NEW BACKEND URL HERE
// (This will be your Render Web Service URL after you deploy it)
// You can use "http://localhost:10000" for local testing
const BACKEND_URL = "http://localhost:10000"; // <-- ⚠️ UPDATE THIS FOR DEPLOYMENT

const Login = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"student" | "faculty" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // --- NEW STATE FOR FACULTY SIGNUP ---
  const [fullName, setFullName] = useState("");
  const [subject, setSubject] = useState("");
  const [rate, setRate] = useState(50); // Default $50

  // --- MODIFIED HELPER FUNCTION TO CHECK MONGODB ---
  const checkUserTypeAndNavigate = async (userId: string) => {
    try {
      // Check if user has a profile in MongoDB via our backend
      const response = await fetch(`${BACKEND_URL}/api/faculty/${userId}`);

      if (response.ok) { // Status 200 - 299, profile was found
        localStorage.setItem('userType', 'faculty');
        navigate("/faculty");
        return 'faculty';
      } else if (response.status === 404) { // Not found, must be a student
        localStorage.setItem('userType', 'student');
        navigate("/student");
        return 'student';
      } else {
        // Handle other errors (like backend is down)
        const err = await response.json();
        throw new Error(err.message || 'Failed to verify user type from backend');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(`Failed to verify user type: ${error.message}. Logging out.`);
      // Log out the user if we can't determine their type
      await supabase.auth.signOut();
      return null;
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Don't trust localStorage, check the DB
        checkUserTypeAndNavigate(user.id);
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userType) {
      toast.error("Please select user type first");
      return;
    }
    
    if (!email || !password) {
      toast.error("Please fill in email and password");
      return;
    }

    if (!isLogin && userType === 'faculty' && (!fullName || !subject || rate <= 0)) {
      toast.error("Please fill in all your faculty profile details");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN LOGIC (Unchanged) ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (!data.user) throw new Error("Login failed, user not found.");

        // Check DB for user type and navigate
        const type = await checkUserTypeAndNavigate(data.user.id);
        if (type) {
          toast.success(`Welcome back, ${type === 'student' ? 'Student' : 'Faculty'}!`);
        }
      } else {
        // --- SIGNUP LOGIC ---
        // 1. Create the user in Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error("Signup failed, user not created.");

        // 2. Check if we need to create a faculty profile
        if (userType === 'faculty') {
          
          // --- MODIFIED: Create profile in MongoDB via our backend ---
          const profileResponse = await fetch(`${BACKEND_URL}/api/faculty`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: signUpData.user.id, // Link to the auth.users table
              name: fullName,
              subject: subject,
              rate: rate,
              available: true,
              rating: 5,
            })
          });

          if (!profileResponse.ok) {
            // This is a partial failure, but we should let the user know
            const profileError = await profileResponse.json();
            throw new Error(`Account created, but profile setup failed: ${profileError.message}`);
          }
          
          localStorage.setItem('userType', 'faculty');
          toast.success('Faculty account created! Please check your email for verification.');
          navigate("/faculty");

        } else {
          // It's a student, just navigate
          localStorage.setItem('userType', 'student');
          toast.success('Student account created! Please check your email for verification.');
          navigate("/student");
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            EduConnect
          </h1>
          <p className="text-muted-foreground text-lg">
            Connecting Students with Expert Faculty
          </p>
        </div>

        {!userType ? (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Student Card (unchanged) */}
            <Card
              className="cursor-pointer group hover:scale-105 transition-transform"
              onClick={() => setUserType("student")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center group-hover:shadow-elegant transition-shadow">
                  <GraduationCap className="w-10 h-10 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Student Login</CardTitle>
                <CardDescription className="text-base">
                  Access your courses and connect with faculty
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Faculty Card (unchanged) */}
            <Card
              className="cursor-pointer group hover:scale-105 transition-transform"
              onClick={() => setUserType("faculty")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center group-hover:shadow-elegant transition-shadow">
                  <Users className="w-10 h-10 text-accent-foreground" />
                </div>
                <CardTitle className="text-2xl">Faculty Login</CardTitle>
                <CardDescription className="text-base">
                  Manage requests and track your earnings
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <button
                onClick={() => {
                  setUserType(null);
                  setEmail("");
                  setPassword("");
                  setFullName("");
                  setSubject("");
                  setRate(50);
                  setIsLogin(true);
                }}
                className="text-sm text-muted-foreground hover:text-foreground mb-2 text-left"
              >
                ← Back to selection
              </button>
              <CardTitle className="text-3xl">
                {isLogin ? 'Login' : 'Sign Up'} as {userType === "student" ? "Student" : "Faculty"}
              </CardTitle>
              <CardDescription>
                {isLogin ? 'Enter your credentials to access your dashboard' : 'Create your account to get started'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {/* --- NEW CONDITIONAL FACULTY FIELDS --- */}
                {!isLogin && userType === 'faculty' && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Dr. Jane Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Main Subject</Label>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="e.g., Physics"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rate">Hourly Rate ($)</Label>
                      <Input
                        id="rate"
                        type="number"
                        placeholder="50"
                        value={rate}
                        onChange={(e) => setRate(parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>
                )}
                
                <Button type="submit" className="w-full" size="lg" variant="gradient" disabled={loading}>
                  {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                </Button>
                
                <p className="text-sm text-center text-muted-foreground">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Login;

