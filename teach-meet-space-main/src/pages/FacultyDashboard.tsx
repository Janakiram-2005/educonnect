import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, DollarSign, TrendingUp, Users, CheckCircle, XCircle, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import VideoMeeting from "@/components/VideoMeeting";

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. MODIFIED to use async IIFE to get user first
    (async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user ?? null;

      if (!currentUser) {
        navigate("/");
        return;
      }
      setUser(currentUser);
      loadRequests(currentUser.id);

      // 2. MODIFIED to be more specific and efficient
      const channel = supabase
        .channel(`faculty-requests-${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for all events
            schema: 'public',
            table: 'requests',
            filter: `faculty_id=eq.${currentUser.id}` // Only for this faculty
          },
          (payload) => {
            console.log('--- FACULTY GOT A REALTIME EVENT ---', payload);

            // A student sent a new request
            if (payload.eventType === 'INSERT') {
              const newData = payload.new as any;
              setRequests(currentRequests => [newData, ...currentRequests]);
              toast.info(`New request from ${newData.student_name}!`);
            }

            // A student cancelled their request
            if (payload.eventType === 'DELETE') {
              const oldData = payload.old as any;
              setRequests(currentRequests =>
                currentRequests.filter(req => req.id !== oldData.id)
              );
            }
            
            // This faculty accepted/rejected (this code is optional,
            // as loadRequests() will also be called, but this is faster)
            if (payload.eventType === 'UPDATE') {
              const oldData = payload.old as any;
              setRequests(currentRequests =>
                currentRequests.filter(req => req.id !== oldData.id)
              );
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('--- FACULTY REALTIME SUBSCRIBED ---');
          }
          if (status === 'CHANNEL_ERROR') {
            console.error('--- FACULTY REALTIME ERROR ---', err);
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    })();
  }, [navigate]); // Removed 'user' dependency

  const loadRequests = async (facultyId: string) => {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('faculty_id', facultyId)
      .eq('status', 'pending') // Only load pending requests
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading requests:', error);
      return;
    }
    setRequests(data || []);
  };

  // This is still static data.
  // We can modify this next to be dynamic!
  const earnings = {
    total: 2450,
    thisMonth: 850,
    pendingWithdraw: 1200,
    hourlyRate: 50,
  };

  const handleAccept = async (requestId: string, studentName: string) => {
    // Generate unique meeting room ID
    const meetingRoomId = `educonnect-${requestId}-${Date.now()}`;

    const { error } = await supabase
      .from('requests')
      .update({ 
        status: 'accepted',
        meeting_room_id: meetingRoomId 
      })
      .eq('id', requestId);

    if (error) {
      toast.error("Failed to accept request");
      console.error(error);
      return;
    }

    toast.success(`Accepted request from ${studentName}! Starting video meeting...`);
    
    // Open video meeting
    setTimeout(() => {
      setActiveMeeting(meetingRoomId);
    }, 1000);
  };

  // 3. MODIFIED handleReject to DELETE the request
  const handleReject = async (requestId: string, studentName: string) => {
    const { error } = await supabase
      .from('requests')
      .delete() // <-- Changed from update() to delete()
      .eq('id', requestId);

    if (error) {
      toast.error("Failed to reject request");
      console.error(error);
      return;
    }

    toast.info(`Rejected request from ${studentName}`);
    // Realtime listener will automatically remove it from the list
  };

  const handleWithdraw = () => {
    toast.success(`Withdrawal request submitted for $${earnings.pendingWithdraw}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userType');
    navigate("/");
    toast.info("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* --- HEADER --- */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            EduConnect
          </h1>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* --- WELCOME --- */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, Faculty!</h2>
          <p className="text-muted-foreground">Manage your sessions and earnings</p>
        </div>

        {/* --- EARNINGS OVERVIEW --- */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-accent">${earnings.total}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                This Month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">${earnings.thisMonth}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Hourly Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${earnings.hourlyRate}/hr</p>
            </CardContent>
          </Card>
        </div>

        {/* --- WITHDRAW SECTION --- */}
        <Card className="mb-8 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent" />
              Withdraw Earnings
            </CardTitle>
            <CardDescription>Available balance for withdrawal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-accent">${earnings.pendingWithdraw}</p>
                <p className="text-sm text-muted-foreground mt-1">Ready to withdraw</p>
              </div>
              <Button variant="success" size="lg" onClick={handleWithdraw}>
                Withdraw Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* --- PENDING REQUESTS --- */}
        <section>
          <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Student Requests ({requests.length})
          </h3>
          
          {requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No pending requests at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <Card key={request.id} className="hover:shadow-elegant transition-shadow">
                  <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold mb-1">{request.student_name}</h4>
                        <p className="text-sm text-muted-foreground">Subject: {request.subject}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="capitalize">
                          {request.status}
                        </Badge>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAccept(request.id, request.student_name)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          // 4. ONCLICK IS NOW handleReject
                          onClick={() => handleReject(request.id, request.student_name)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* --- VIDEO MEETING --- */}
      {activeMeeting && (
        <VideoMeeting 
          roomId={activeMeeting} 
          onClose={() => setActiveMeeting(null)} 
        />
      )}
    </div>
  );
};

export default FacultyDashboard;