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
} from "@stream-io/video-react-sdk";
// import CallContainer from "../components/CallContainer";

import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import config from "../config";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "../components/Calls.css"


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

    const initCall = async () => {
      try {
        console.log("Initializing call with user ID:", userId);
        console.log("Token available:", !!token);

        const videoClient = StreamVideoClient.getOrCreateInstance({
          apiKey: config.STREAM_APIKEY,
          user,
          token: token || undefined,
        });

        console.log("User connected successfully");

        const newCall = videoClient.call("default", "fad-call");
        console.log("Call created:", newCall.id);
        
        await newCall.getOrCreate();
        console.log("Call initialized successfully");

        if (mounted) {
          setClient(videoClient);
          setCall(newCall);
          setIsCallInitialized(true);
          await newCall.join({create: true});
          console.log("Joined call successfully");
        }
      } catch (error) {
        console.error("Error initializing call:", error);
      }
    };

    if (!client && !call) {
      initCall();
    }

    return () => {
      mounted = false;
      if (call) {
        call.leave();
      }
      if (client) {
        client.disconnectUser();
        setClient(null);
        setCall(null);
      }
    };
  }, []);

  if (!client || !call || !isCallInitialized) {
    return <div className="flex justify-center items-center h-screen">Initializing call...</div>;
  }

  return (
    <div className="flex h-screen bg-[#1B4965] p-5 sm:gap-10 md:gap-2 text-white">
      {/* <div className="w-[350px] bg-gray-300 rounded-lg">
        <div className="flex items-center gap-4 p-5">
          <div className="bg-green-200 p-2 rounded-full border-1">
            <WarningIcon sx={{color: "maroon", fontSize: "3em"}} />
          </div>
          <div>
            <h2 className="text-xl font-bold">ID: {call?.id}</h2>
            <p className="text-green-700 font-bold text-lg">GENERAL CALL</p>
            <p className="text-sm">A. S. Fortune St, Mandaue City</p>
            <p className="text-sm">Coordinates: 10.343897, 123.932080</p>
          </div>
        </div>

        <div className="my-1 bg-white p-5">
          <div className="flex items-center gap-4">
            <img
              src={avatarImg}
              alt="avatar"
              className="w-20 h-20 rounded-full"
            />
            <div>
              <h3 className="text-xl uppercase font-bold">{user?.name}</h3>
              <p className="text-sm">1234567890</p>
              <p className="text-sm">GuardianPH Opcen</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <label className="text-lg font-bold">Directory</label>
          <input
            type="text"
            placeholder="Search"
            className="w-full p-2 border rounded bg-white"
          />
        </div>

        <div className="px-5 overflow-auto h-[460px]">
          <div>
            <label className="text-lg font-bold">Operation Centers</label>
            {all.opCenters.map((opCenter, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  padding: "12px",
                  cursor: "pointer",
                  marginBottom: "1px",
                  transition: "all 0.2s ease",
                  backgroundColor: "white",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                    transform: "translateX(4px)",
                  },
                }}>
                {opCenter}
              </Paper>
            ))}
          </div>

          <div className="mt-5">
            <label className="text-lg font-bold">Police Stations</label>
            {all.policeStations.map((stations, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  padding: "12px",
                  cursor: "pointer",
                  marginBottom: "1px",
                  transition: "all 0.2s ease",
                  backgroundColor: "white",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                    transform: "translateX(4px)",
                  },
                }}>
                {stations}
              </Paper>
            ))}
          </div>
          <div className="mt-5">
            <label className="text-lg font-bold">Hospitals</label>
            {all.hospitals.map((hospital, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  padding: "12px",
                  cursor: "pointer",
                  marginBottom: "1px",
                  transition: "all 0.2s ease",
                  backgroundColor: "white",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                    transform: "translateX(4px)",
                  },
                }}>
                {hospital}
              </Paper>
            ))}
          </div>
        </div>
      </div> */}

      {/* video call*/}
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

export const VideoCall = ({ client }: { client: StreamVideoClient }) => {
  const call = useCall();
  const navigate = useNavigate();

  const {
    useParticipantCount,
 
  } = useCallStateHooks();

  const participantCount = useParticipantCount();


  const handleLeaveCall = async () => {
    try {
      if (call) {
        // Cleanup function to ensure all resources are properly released
        const cleanup = async () => {
          try {
            // First leave the call
            await call.leave();
            console.log("Successfully left the call");
            
            // Aggressive approach to stop ALL media tracks
            try {
              // Method 1: Stop camera and microphone through the Stream SDK
              if (call.camera) {
                await call.camera.disable();
                console.log("Camera disabled through SDK");
              }
              
              if (call.microphone) {
                await call.microphone.disable();
                console.log("Microphone disabled through SDK");
              }
              
              // Method 2: Get all tracks from all video/audio elements and stop them
              const mediaElements = document.querySelectorAll('video, audio');
              let tracksCount = 0;
              
              mediaElements.forEach(element => {
                const htmlElement = element as HTMLMediaElement;
                if (htmlElement.srcObject instanceof MediaStream) {
                  const stream = htmlElement.srcObject as MediaStream;
                  stream.getTracks().forEach(track => {
                    track.stop();
                    tracksCount++;
                  });
                  htmlElement.srcObject = null;
                }
              });
              
              console.log(`Stopped ${tracksCount} tracks from media elements`);
              
              // Method 3: Force a permission reset by getting and immediately stopping new streams
              const newStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                .catch(e => {
                  console.log("Could not get new media stream:", e);
                  return null;
                });
                
              if (newStream) {
                newStream.getTracks().forEach(track => {
                  track.stop();
                });
                console.log("New test stream stopped to force permissions reset");
              }
              
              // Attempt to release user media by enumeration
              const devices = await navigator.mediaDevices.enumerateDevices()
                .catch(e => {
                  console.log("Could not enumerate devices:", e);
                  return [];
                });
                
              console.log(`Found ${devices.length} media devices to check`);
              
              // Extra safeguard: explicitly clear any active streams in the browser
              if (typeof window !== 'undefined') {
                // Attempt to reset permission state
                if (navigator.permissions && navigator.permissions.query) {
                  const camPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
                    .catch(() => null);
                  const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
                    .catch(() => null);
                    
                  console.log("Camera permission state:", camPermission?.state);
                  console.log("Microphone permission state:", micPermission?.state);
                }
              }
            } catch (mediaError) {
              console.error("Could not stop all media tracks:", mediaError);
            }
            
            // Disconnect the client
            if (client) {
              await client.disconnectUser();
              console.log("User disconnected from video client");
            }
            
            // Close the window
            window.close();
            
            // Navigate as fallback if window doesn't close
            navigate("/main");
          } catch (error) {
            console.error("Error during cleanup:", error);
            // Try to navigate anyway as a fallback
            navigate("/main");
          }
        };
        
        // Execute the cleanup
        await cleanup();
      }
    } catch (error) {
      console.error("Error leaving call:", error);
      // Navigate as a failsafe
      navigate("/main");
    }
  };


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
      {/* <Typography variant="h6" color="white">
        Participants in this call: {participantCount}
      </Typography> */}
    </div>
  </StreamTheme>

    </div>
    
  );
};
