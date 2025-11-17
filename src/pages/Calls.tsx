import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  StreamTheme,
  SpeakerLayout,
  CancelCallButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  SpeakingWhileMutedNotification,
  User,
  RingingCall,
} from "@stream-io/video-react-sdk";
import { CallingState } from '@stream-io/video-client';
import {useEffect, useState, useRef} from "react";
import {useNavigate} from "react-router-dom";
import config from "../config";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "../components/Calls.css" // Make sure this path is correct


const userStr = localStorage.getItem("user");
const userStr2 = userStr ? JSON.parse(userStr) : null;
const userId = userStr2?.id;
const token = localStorage.getItem("token");

const user: User = {
  id: userId,
  name: userStr2?.firstName && userStr2?.lastName 
    ? `${userStr2.firstName} ${userStr2.lastName}` 
    : userStr2?.name || userStr2?.email || "Unknown User",
};


export default function Calls() {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isCallInitialized, setIsCallInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let videoClient: StreamVideoClient | null = null;
    let newCall: Call | null = null;

    const initCall = async () => {
      try {
        console.log("Initializing call in POPUP...");
        videoClient = StreamVideoClient.getOrCreateInstance({
          apiKey: config.STREAM_APIKEY,
          user,
          token: token || undefined,
        });
        console.log("User connected in POPUP");

        

        const urlParams = new URLSearchParams(window.location.search);
        const callIdFromUrl = urlParams.get('id');
        const volunteerIdFromUrl = urlParams.get('volunteer');

        if (!callIdFromUrl || !volunteerIdFromUrl) {
          console.error("POPUP: No call ID or volunteer ID found in URL");
          return;
        }

        // Use the callId from the URL
        newCall = videoClient.call("default", callIdFromUrl);

        // We DO NOT join. We just create the call.
        await newCall.getOrCreate({
          ring: true,
          data: {
            members: [
              { user_id: userId },
              { user_id: volunteerIdFromUrl },
            ],
            settings_override: {
              ring: {
                incoming_call_timeout_ms: 30000,
                auto_cancel_timeout_ms: 30000
              }
            }
          }
        });
        console.log("POPUP: Call created and is ringing.");

        if (mounted) {
          setClient(videoClient);
          setCall(newCall);
          setIsCallInitialized(true);
        }
      } catch (error) {
        console.error("POPUP: Error initializing call:", error);
      }
    };

    initCall();

    return () => {
      mounted = false;
      console.log("POPUP: Cleanup running.");
      if (newCall) {
        newCall.leave();
      }
      // if (videoClient) {
      //   videoClient.disconnectUser();
      // }
    };
  }, []);

  if (!client || !call || !isCallInitialized) {
    return <div className="flex justify-center items-center h-screen">Initializing call...</div>;
  }

  return (
    <div className="flex h-screen bg-[#1B4965] p-5 sm:gap-10 md:gap-2 text-white">
      <div className="flex-1">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <VideoCall client={client} />
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  );
}

// --- VideoCall component ---
export const VideoCall = ({ client }: { client: StreamVideoClient }) => {
  const call = useCall();
  const navigate = useNavigate();
  const [callingState, setCallingState] = useState(call?.state.callingState);
  
  // This state tracks if the callee has accepted
  const [isAccepted, setIsAccepted] = useState(false);
  
  useEffect(() => {
    if (!call) return;

    setCallingState(call.state.callingState);

    // Subscribe to state changes
    const unsubscribeState = call.state.callingState$.subscribe((newState) => {
      console.log("Call state changed:", newState);
      setCallingState(newState);
    });
    
    // Listen for the 'call.accepted' event
    const handleCallAccepted = (event: any) => {
      console.log('call.accepted event received!', event);
      setIsAccepted(true); // Set our new state to true
    };

    call.on('call.accepted', handleCallAccepted);
    
    return () => {
      unsubscribeState.unsubscribe();
      call.off('call.accepted', handleCallAccepted);
    };
  }, [call]); 
  
  useEffect(() => {
    console.log("Current calling state in render:", callingState);
  }, [callingState]);

  
  const handleLeaveCall = async () => {
    try {
      if (call) {
        const cleanup = async () => {
          try {
            await call.endCall();
            console.log("Call session terminated on server.");
            await call.leave();
            console.log("Successfully left the call");
            
            if (client) {
              await client.disconnectUser();
              console.log("User disconnected from video client");
            }
            window.close();
          } catch (error) {
            console.error("Error during cleanup:", error);
            window.close();
          }
        };
        await cleanup();
      }
    } catch (error) {
      console.error("Error leaving call:", error);
      window.close();
    }
  };

  // This is the click handler for the "Join" button
  const handleJoinCall = () => {
    if (call) {
      call.join();
    }
  };

  // This UI will be shown for RINGING
  if (callingState === CallingState.RINGING) {
    return (
      <div className="flex-1 h-full flex justify-center items-center flex-col text-black">
        <StreamTheme>
          <RingingCall />
          
          {/* This logic shows the "Click to Join" button after acceptance */}
          {/* {isAccepted ? (
            <button 
              className="str-video__button str-video__button--primary"
              onClick={handleJoinCall}
              style={{ marginTop: '1rem' }}
            >
              Call Accepted! Click to Join
            </button>
          ) : (
            <div className="flex justify-center items-center gap-5 mt-4">
              <CancelCallButton onClick={handleLeaveCall} />
            </div>
          )} */}
        </StreamTheme>
      </div>
    );
  }

  // This UI will be shown when the callee accepts AND you click "Join"
  if (callingState === CallingState.JOINED) {
    return (
      <div className="flex-1 h-full">
        <StreamTheme>
          <SpeakerLayout participantsBarPosition="top" />
          <div className="flex justify-center items-center gap-5 mt-4">
            <SpeakingWhileMutedNotification>
              <ToggleAudioPublishingButton />
            </SpeakingWhileMutedNotification>
            <ToggleVideoPublishingButton />
            <CancelCallButton 
              onClick={handleLeaveCall}
            />
          </div>
        </StreamTheme>
      </div>
    );
  }

  if (callingState === CallingState.LEFT) {
    console.log("Call has been left, closing window.");
    handleLeaveCall(); 
    return <div className="flex justify-center items-center h-screen">Call ended. Closing...</div>;
  }

  return <div className="flex justify-center items-center h-screen">Loading call state...</div>;
};