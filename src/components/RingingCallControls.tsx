import { CallingState } from '@stream-io/video-client';
import { Button } from '@mui/material';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';

export const RingingCallControls = () => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  console.log("RingingCallControls - Call state:", callingState);
  console.log("Call is created by me:", call?.isCreatedByMe);

  if (!call) return null;
  
  if (![CallingState.RINGING, CallingState.JOINING].includes(callingState))
    return null;

  const buttonsDisabled = callingState === CallingState.JOINING;
  
  const handleAccept = () => {
    console.log("Accepting call...");
    call.join();
  };
  
  const handleDecline = () => {
    console.log("Declining call...");
    const reason = call.isCreatedByMe ? 'cancel' : 'decline';
    call.leave({ reject: true, reason });
  };

  return (
    <div className="flex justify-center items-center gap-4 mt-4">
      {call.isCreatedByMe ? (
        <Button
          variant="contained"
          color="error"
          disabled={buttonsDisabled}
          onClick={handleDecline}
          startIcon={<CallEndIcon />}
          sx={{ borderRadius: '50px', padding: '10px 20px' }}
        >
          Cancel
        </Button>
      ) : (
        <>
          <Button
            variant="contained"
            color="success"
            disabled={buttonsDisabled}
            onClick={handleAccept}
            startIcon={<CallIcon />}
            sx={{ borderRadius: '50px', padding: '10px 20px' }}
          >
            Accept
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={buttonsDisabled}
            onClick={handleDecline}
            startIcon={<CallEndIcon />}
            sx={{ borderRadius: '50px', padding: '10px 20px' }}
          >
            Decline
          </Button>
        </>
      )}
    </div>
  );
}; 