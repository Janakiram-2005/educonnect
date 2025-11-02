import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface VideoMeetingProps {
  roomId: string;
  onClose: () => void;
}

const VideoMeeting = ({ roomId, onClose }: VideoMeetingProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Jitsi Meet will be embedded in the iframe
    // Using Jitsi's public instance for simplicity
    const domain = "meet.jit.si";
    const options = {
      roomName: roomId,
      width: "100%",
      height: "100%",
      parentNode: iframeRef.current,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
        ],
      }
    };

    return () => {
      // Cleanup
    };
  }, [roomId]);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[90vh]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Video Meeting</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)]">
          <iframe
            ref={iframeRef}
            src={`https://meet.jit.si/${roomId}`}
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-full rounded-lg"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoMeeting;
