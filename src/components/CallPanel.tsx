import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { RingingCall } from './RingingCall';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';

// Keep track of which calls have already opened windows at the module level
const openedCallWindows = new Set<string>();

export const CallPanel = () => {
  const call = useCall();
  const navigate = useNavigate();
  const { useCallCallingState, useCallCreatedBy } = useCallStateHooks();
  const callingState = useCallCallingState();
  const creator = useCallCreatedBy();
  const windowRef = useRef<Window | null>(null);

  useEffect(() => {
    console.log(`Call state in CallPanel: ${callingState}`);
    console.log("Call creator:", creator);
    
    if (callingState === CallingState.JOINED && call) {
      // Only open a new window if this call hasn't opened one yet
      if (!openedCallWindows.has(call.cid)) {
        console.log("Call joined, opening call in new window");
        const width = window.screen.width;
        const height = window.screen.height;
        const newWindow = window.open('/call', '_blank', `width=${width},height=${height},left=0,top=0`);
        
        // Track this call as having opened a window
        openedCallWindows.add(call.cid);
        windowRef.current = newWindow;

        // Attempt to maximize the window
        if (newWindow) {
          newWindow.moveTo(0, 0);
          newWindow.resizeTo(screen.availWidth, screen.availHeight);
          newWindow.focus();
          
          // Remove the call ID from tracking when the window closes
          newWindow.addEventListener('beforeunload', () => {
            openedCallWindows.delete(call.cid);
          });
        } else {
          console.error("Failed to open new window for call. Pop-up might be blocked.");
        }
      } else {
        console.log(`Window already opened for call ${call.cid}, not opening another`);
        // Focus the existing window if we have a reference to it
        if (windowRef.current && !windowRef.current.closed) {
          windowRef.current.focus();
        }
      }
    }
    
    // Clean up tracking when call ends
    return () => {
      if (call && [CallingState.LEFT, CallingState.IDLE].includes(callingState)) {
        openedCallWindows.delete(call.cid);
      }
    };
  }, [callingState, call, creator]);

  if (!call) {
    console.log("No call object available");
    return null;
  }

  console.log("Call details:", {
    id: call.id,
    cid: call.cid,
    isCreatedByMe: call.isCreatedByMe,
    callingState: callingState,
    creator: creator,
    members: call.state.members
  });

  if ([CallingState.RINGING, CallingState.JOINING].includes(callingState)) {
    console.log("Rendering RingingCall UI for call state:", callingState);
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <RingingCall includeSelf={true} totalMembersToShow={4} />
      </div>
    );
  }

  return null;
}; 