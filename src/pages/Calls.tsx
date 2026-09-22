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


// Module-level cache so React StrictMode or component re-renders NEVER execute
// newCall.getOrCreate({ ring: true }) twice for the same callId.
const callInitCache = new Map<string, Promise<{ client: StreamVideoClient; call: Call }>>();

export default function Calls() {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isCallInitialized, setIsCallInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

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

        const urlParams = new URLSearchParams(window.location.search);
        const callIdFromUrl = urlParams.get('id');
        const calleeIdFromUrl = urlParams.get('volunteer') || urlParams.get('responder');

        if (!callIdFromUrl || !calleeIdFromUrl) {
          console.error("POPUP: No call ID or callee (volunteer/responder) ID found in URL");
          return;
        }

        // Cache the initialization promise so StrictMode double-mount or multiple renders
        // will await the exact same single Call instance instead of creating duplicates.
        if (!callInitCache.has(callIdFromUrl)) {
          const initPromise = (async () => {
            const getImageUrl = (url?: string) => {
              if (!url) return undefined;
              if (url.startsWith('http://') || url.startsWith('https://')) return url;
              const serverUrl = config.GUARDIAN_SERVER_URL || '';
              return `${serverUrl.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
            };

            const profileImageUrl = getImageUrl(currentUser?.profileImage || currentUser?.image);

            const activeUser: User = {
              id: currentUserId,
              name: currentUser?.firstName && currentUser?.lastName 
                ? `${currentUser.firstName} ${currentUser.lastName}` 
                : currentUser?.name || currentUser?.email || "Unknown User",
              image: profileImageUrl,
            };

            const videoClient = StreamVideoClient.getOrCreateInstance({
              apiKey: config.STREAM_APIKEY,
              user: activeUser,
              token: currentToken,
            });
            console.log("User connected in POPUP", activeUser);

            const newCall = videoClient.call("default", callIdFromUrl, { reuseInstance: true });

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

            return { client: videoClient, call: newCall };
          })();

          callInitCache.set(callIdFromUrl, initPromise);
        }

        const { client: videoClient, call: activeCall } = await callInitCache.get(callIdFromUrl)!;

        if (mounted) {
          setClient(videoClient);
          setCall(activeCall);
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

// --- Participant Logger (must be inside StreamCall context) ---
function ParticipantLogger() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const call = useCall();

  useEffect(() => {
    console.group('%c[PARTICIPANTS IN CALL]', 'color: #00bcd4; font-weight: bold;');
    console.log('Total participant count:', participants.length);
    participants.forEach((p, i) => {
      console.log(`  [${i}] userId: ${p.userId} | sessionId: ${p.sessionId} | isLocal: ${p.isLocalParticipant} | audioMuted: ${!p.publishedTracks?.includes(1)} | videoMuted: ${!p.publishedTracks?.includes(2)} | name: ${p.name}`);
    });
    console.groupEnd();
  }, [participants]);

  // Also log raw call state every 5s for debugging
  useEffect(() => {
    if (!call) return;
    const interval = setInterval(() => {
      const pts = call.state.participants;
      console.group('%c[CALL STATE POLL - every 5s]', 'color: #ff9800; font-weight: bold;');
      console.log('callingState:', call.state.callingState);
      console.log('participants from call.state:', pts.length);
      pts.forEach((p: any, i: number) => {
        console.log(`  [${i}] userId: ${p.userId} | sessionId: ${p.sessionId} | isLocal: ${p.isLocalParticipant} | publishedTracks: ${JSON.stringify(p.publishedTracks)} | name: ${p.name}`);
      });
      console.groupEnd();
    }, 5000);
    return () => clearInterval(interval);
  }, [call]);

  return null;
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
  
  // Disable dispatcher camera on mount and whenever call or callingState changes
  useEffect(() => {
    if (!call) return;
    call.camera.disable().catch((err) => {
      console.log("Error disabling dispatcher camera:", err);
    });
  }, [call, callingState]);

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
      console.log('call.accepted event received in POPUP! Current state:', call.state.callingState, event);
      setIsAccepted(true);
      // NOTE: Do NOT call call.join() here.
      // The Stream SDK auto-joins the caller when the callee accepts a ring call.
      // Calling join() explicitly here in addition to the SDK auto-join creates
      // a DUPLICATE SFU session (ghost participant with a second sessionId for the
      // same userId). The auto-join will transition callingState → JOINING → JOINED
      // automatically, which the callingState$ subscription will pick up and re-render.
      // The "Click if not redirected automatically" button (handleJoinCall) is the
      // fallback if the auto-join doesn't fire within a reasonable time.
      console.log('Waiting for SDK auto-join to transition state from RINGING to JOINED...');
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

  
  // Safeguard: If another session of this same dispatcher somehow exists as a remote participant,
  // mute their audio immediately on the SFU so ghost audio cannot be heard by other participants.
  useEffect(() => {
    if (!call || !currentUserId) return;

    const muteGhostRemoteSessions = () => {
      const duplicateRemote = call.state.remoteParticipants.some(
        p => p.userId === currentUserId && !p.isLocalParticipant
      );
      if (duplicateRemote) {
        console.warn("Ghost remote session detected for dispatcher, muting remotely...");
        call.muteUser(currentUserId, 'audio').catch(() => {});
      }
    };

    const unsubscribe = call.state.remoteParticipants$.subscribe(muteGhostRemoteSessions);
    return () => unsubscribe.unsubscribe();
  }, [call, currentUserId]);

  const handleLeaveCall = async () => {
    try {
      const callIdFromUrl = new URLSearchParams(window.location.search).get('id');
      if (callIdFromUrl) {
        callInitCache.delete(callIdFromUrl);
      }
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
      const callIdFromUrl = new URLSearchParams(window.location.search).get('id');
      if (callIdFromUrl) {
        callInitCache.delete(callIdFromUrl);
      }
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
        await call.camera.disable();
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
          
          {isAccepted && (
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
          {/* ParticipantLogger lives inside StreamCall so it can use useCallStateHooks */}
          <ParticipantLogger />
          <SpeakerLayout 
            participantsBarPosition={null}
            excludeLocalParticipant={true}
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