-- Create requests table to store student-faculty session requests
CREATE TABLE public.requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  faculty_id UUID NOT NULL,
  faculty_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  meeting_room_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Students can view their own requests
CREATE POLICY "Students can view their own requests" 
ON public.requests 
FOR SELECT 
USING (student_id = auth.uid());

-- Faculty can view requests made to them
CREATE POLICY "Faculty can view their requests" 
ON public.requests 
FOR SELECT 
USING (faculty_id = auth.uid());

-- Students can create requests
CREATE POLICY "Students can create requests" 
ON public.requests 
FOR INSERT 
WITH CHECK (student_id = auth.uid());

-- Faculty can update their requests
CREATE POLICY "Faculty can update their requests" 
ON public.requests 
FOR UPDATE 
USING (faculty_id = auth.uid());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_requests_updated_at
BEFORE UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for requests table
ALTER TABLE public.requests REPLICA IDENTITY FULL;