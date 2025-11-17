import { CallingState } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { RingingCall } from './RingingCall';

export const CallPanel = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  // This component's only job is to show the "Accept" UI.
  // Its parent (VideoCallHandler) has already confirmed
  // this is a real incoming call.
  if ([CallingState.RINGING, CallingState.JOINING].includes(callingState)) {
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