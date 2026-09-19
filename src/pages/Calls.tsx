import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  useConnectedUser,
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

        const currentUserStr = localStorage.getItem("user");
        const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
        const currentUserId = currentUser?.id || currentUser?._id;
        const currentToken = localStorage.getItem("token");

        if (!currentUserId || !currentToken) {
          console.error("POPUP: User or token not found in localStorage");
          return;
        }

        const activeUser: User = {
          id: currentUserId,
          name: currentUser?.firstName && currentUser?.lastName 
            ? `${currentUser.firstName} ${currentUser.lastName}` 
            : currentUser?.name || currentUser?.email || "Unknown User",
        };

        videoClient = StreamVideoClient.getOrCreateInstance({
          apiKey: config.STREAM_APIKEY,
          user: activeUser,
          token: currentToken,
        });
        console.log("User connected in POPUP", activeUser);

        const urlParams = new URLSearchParams(window.location.search);
        const callIdFromUrl = urlParams.get('id');
        const calleeIdFromUrl = urlParams.get('volunteer') || urlParams.get('responder');

        if (!callIdFromUrl || !calleeIdFromUrl) {
          console.error("POPUP: No call ID or callee (volunteer/responder) ID found in URL");
          return;
        }

        // Use the callId from the URL with reuseInstance: true to avoid creating duplicate Call objects
        newCall = videoClient.call("default", callIdFromUrl, { reuseInstance: true });

        // We DO NOT join yet. We create the call with ring: true and wait for callee to accept.
        await newCall.getOrCreate({
          ring: true,
          data: {
            members: [
              { user_id: currentUserId },
              { user_id: calleeIdFromUrl },
            ],
            settings_override: {
              ring: {
                incoming_call_timeout_ms: 30000,
                auto_cancel_timeout_ms: 30000
              }
            }
          }
        });
        console.log("POPUP: Call created and is ringing.", callIdFromUrl);

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
  const connectedUser = useConnectedUser();
  const currentUserId = connectedUser?.id || call?.currentUserId;
  const navigate = useNavigate();
  const [callingState, setCallingState] = useState(call?.state.callingState);
  
  // This state tracks if the callee has accepted
  const [isAccepted, setIsAccepted] = useState(false);
  const isJoiningRef = useRef(false);
  
  useEffect(() => {
    if (!call) return;

    setCallingState(call.state.callingState);

    // Subscribe to state changes
    const unsubscribeState = call.state.callingState$.subscribe((newState) => {
      console.log("Call state changed:", newState);
      setCallingState(newState);
    });
    
    // Listen for the 'call.accepted' event
    const handleCallAccepted = async (event: any) => {
      console.log('call.accepted event received in POPUP!', event);
      setIsAccepted(true); // Set our new state to true
      if (!isJoiningRef.current && call.state.callingState !== CallingState.JOINED && call.state.callingState !== CallingState.JOINING) {
        isJoiningRef.current = true;
        try {
          await call.join();
          console.log('Caller auto-joined call after callee accepted');
        } catch (error) {
          console.log('Auto-join status in popup:', error);
          isJoiningRef.current = false;
        }
      }
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

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (call) {
        call.leave().catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [call]);

  // This is the click handler for the "Join" button
  const handleJoinCall = async () => {
    if (call && !isJoiningRef.current) {
      isJoiningRef.current = true;
      try {
        await call.join();
      } catch (err) {
        console.error("Error joining call:", err);
        isJoiningRef.current = false;
      }
    }
  };

  // This UI will be shown for RINGING
  if (callingState === CallingState.RINGING) {
    return (
      <div className="flex-1 h-full flex justify-center items-center flex-col text-black">
        <StreamTheme>
          <RingingCall />
          
          {isAccepted ? (
            <div className="flex flex-col items-center gap-3 mt-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1B4965', fontWeight: 600 }}>
                <span>Connecting to call...</span>
              </div>
              <button 
                className="str-video__button str-video__button--primary"
                onClick={handleJoinCall}
                style={{ padding: '8px 16px', fontSize: '0.85rem', backgroundColor: '#1976D2', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
              >
                Click if not redirected automatically
              </button>
            </div>
          ) : (
            <div className="flex justify-center items-center gap-5 mt-4">
              <CancelCallButton onClick={handleLeaveCall} />
            </div>
          )}
        </StreamTheme>
      </div>
    );
  }

  // This UI will be shown when the callee accepts AND you click "Join"
  if (callingState === CallingState.JOINED) {
    return (
      <div className="flex-1 h-full">
        <StreamTheme>
          <SpeakerLayout 
            participantsBarPosition="top"
            filterParticipants={(participant) => {
              // Exclude ghost/duplicate session of local user from another tab or previous connection
              if (currentUserId && participant.userId === currentUserId && !participant.isLocalParticipant) {
                console.log("Filtering out duplicate dispatcher participant session:", participant.sessionId);
                return false;
              }
              return true;
            }}
          />
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