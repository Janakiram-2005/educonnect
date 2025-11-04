import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, BookOpen, Calendar, DollarSign, Video, XCircle } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import VideoMeeting from "@/components/VideoMeeting";

// 1. MODIFIED: Reads the URL from your .env.local file
// This will be "http://localhost:10000" on your local machine
// and "https://educonnect-backend.onrender.com" when deployed
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeMeeting, setActiveMeeting] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const currentUser = data?.user ?? null;

        if (!currentUser) {
          navigate("/");
          return;
        }

        setUser(currentUser);
        // Load requests from Supabase (as before)
        loadMyRequests(currentUser.id);
        
        // Load subjects & faculty from MongoDB (new!)
        loadSubjects();
        loadFaculty();

        // Supabase Realtime for requests (as before)
        const channel = supabase
          .channel(`student-requests-${currentUser.id}`)
          .on(
            'postgres_changes',
            {
              event: '*', 
              schema: 'public',
              table: 'requests',
              filter: `student_id=eq.${currentUser.id}`
            },
            (payload) => {
              console.log('--- STUDENT GOT A REALTIME EVENT ---', payload);

              if (payload.eventType === 'INSERT') {
                const newData = payload.new as any;
                setMyRequests(currentRequests => [newData, ...currentRequests]);
                toast.success(`Request sent to ${newData.faculty_name}!`);
              }

              if (payload.eventType === 'UPDATE') {
                const newData = payload.new as any;
                if (
                  newData.status === 'accepted' &&
                  newData.meeting_room_id &&
                  newData.student_id === currentUser.id
                ) {
                  toast.success("Faculty accepted! Starting video meeting...");
                  setTimeout(() => setActiveMeeting(newData.meeting_room_id), 1000);
                }
                setMyRequests(currentRequests =>
                  currentRequests.map(req =>
                    req.id === newData.id ? newData : req
                  )
                );
              }

              if (payload.eventType === 'DELETE') {
                const oldData = payload.old as any;
                setMyRequests(currentRequests => 
                  currentRequests.filter(req => req.id !== oldData.id)
                );
                toast.info("A request was cancelled or removed.");
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('--- REALTIME SUBSCRIBED ---');
            }
            if (status === 'CHANNEL_ERROR') {
              console.error('--- REALTIME CHANNEL ERROR ---', err);
            }
          });

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error('Error during auth/getUser or realtime setup', err);
      }
    })();
  }, [navigate]);

  const loadMyRequests = async (studentId: string) => {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading requests:', error);
      return;
    }
    setMyRequests(data || []);
  };

  // --- MODIFIED: Load Subjects from MongoDB ---
  const loadSubjects = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/subjects`);
      if (!response.ok) throw new Error('Failed to fetch subjects');
      const data = await response.json();
      setSubjects(data || []);
    } catch (error) {
      console.error("Error loading subjects:", error);
      // Don't toast error on page load
    }
  };

  // --- MODIFIED: Load Faculty from MongoDB ---
  const loadFaculty = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/faculty`);
      if (!response.ok) throw new Error('Failed to fetch faculty');
      const data = await response.json();
      setFaculty(data || []);
    } catch (error) {
      console.error("Error loading faculty:", error);
    }
  };

  const handleRequest = async (facultyId: string, facultyName: string, subject: string) => {
    if (!user) {
      toast.error("Please login first");
      return;
    }

    const { error } = await supabase
      .from('requests')
      .insert({
        student_id: user.id,
        student_name: user.email?.split('@')[0] || 'Student',
        faculty_id: facultyId, // This is the Supabase auth ID, which matches the MongoDB 'id'
        faculty_name: facultyName,
        subject: subject,
        status: 'pending'
      });

    if (error) {
      toast.error("Failed to send request");
      console.error(error);
      return;
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    // We use a simple browser confirm here.
    // In a real app, you might use a custom modal.
    if (!window.confirm("Are you sure you want to cancel this request?")) {
      return;
    }
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      toast.error(`Failed to cancel request: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userType');
    navigate("/");
    toast.info("Logged out successfully");
  };
  
  // --- ADDED: Function for the Pay Now button ---
  const handlePaymentClick = () => {
    navigate('/payment');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
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
        {/* --- WELCOME & FEE --- */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, Student!</h2>
          <p className="text-muted-foreground">Find the perfect faculty for your subjects</p>
        </div>
        <Card className="mb-8 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent" />
              Monthly Platform Fee
            </CardTitle>
            <CardDescription>Active subscription status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-accent">$29.99</p>
                <p className="text-sm text-muted-foreground mt-1">Due on 15th of each month</p>
              </div>
              {/* --- MODIFIED: Pay Now button --- */}
              <Button variant="success" onClick={handlePaymentClick}>Pay Now</Button>
            </div>
          </CardContent>
        </Card>

        {/* --- SUBJECTS (MODIFIED with links) --- */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Available Subjects
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subjects.map((subject) => {
              // Create a YouTube search link for the subject
              const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(subject.name + ' tutorial')}`;
              
              return (
                <a
                  key={subject._id || subject.id} // Use _id from MongoDB
                  href={youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">{subject.name}</CardTitle>
                      <CardDescription>{subject.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </a>
              );
            })}
          </div>
        </section>

        {/* --- FACULTY --- */}
        <section>
          <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Available Faculty
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Use prof.id here, which links to Supabase auth user.id */}
            {faculty.map((prof) => (
              <Card key={prof.id}> 
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-1">{prof.name}</CardTitle>
                      <CardDescription>{prof.subject}</CardDescription>
                    </div>
                    {prof.available ? (
                      <Badge variant="default" className="bg-accent">Available</Badge>
                    ) : (
                      <Badge variant="secondary">Busy</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Hourly Rate</span>
                      <span className="text-xl font-bold text-primary">${prof.rate}/hr</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      <span className="font-semibold">⭐ {prof.rating}</span>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleRequest(prof.id, prof.name, prof.subject)}
                      disabled={!prof.available}
                      variant={prof.available ? "default" : "secondary"}
                    >
                      {prof.available ? "Request Session" : "Not Available"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* --- MY REQUESTS --- */}
        {myRequests.length > 0 && (
          <section className="mt-12">
            <h3 className="text-2xl font-semibold mb-6">My Requests</h3>
            <div className="grid gap-4">
              {myRequests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{req.faculty_name}</p>
                        <p className="text-sm text-muted-foreground">{req.subject}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={req.status === 'accepted' ? 'default' : req.status === 'pending' ? 'secondary' : 'destructive'}>
                          {req.status}
                        </Badge>
                        
                        {req.status === 'pending' && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleCancelRequest(req.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          onClick={() => {
                            if (req.status === 'accepted' && req.meeting_room_id) {
                              setActiveMeeting(req.meeting_room_id);
                            } else {
                              toast.info("Waiting for faculty to accept and start the meeting.");
                            }
                          }}
                          disabled={req.status !== 'accepted' || !req.meeting_room_id}
                        >
                          <Video className="w-4 h-4 mr-1" />
                          Join Meeting
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
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

export default StudentDashboard;

