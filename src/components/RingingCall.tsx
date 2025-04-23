import { CallingState, UserResponse } from '@stream-io/video-client';
import {
  useCall,
  useCallStateHooks,
  useConnectedUser,
} from '@stream-io/video-react-sdk';
import { Avatar, Paper, Typography, Button } from '@mui/material';
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import medicalIcon from '../assets/images/Medical.png';
import { useRingSound } from '../hooks/useRingSound';

const CALLING_STATE_TO_LABEL: Record<CallingState, string> = {
  [CallingState.JOINING]: 'Joining',
  [CallingState.RINGING]: 'Ringing',
  [CallingState.MIGRATING]: 'Migrating',
  [CallingState.RECONNECTING]: 'Re-connecting',
  [CallingState.RECONNECTING_FAILED]: 'Failed',
  [CallingState.OFFLINE]: 'No internet connection',
  [CallingState.IDLE]: '',
  [CallingState.UNKNOWN]: '',
  [CallingState.JOINED]: 'Joined',
  [CallingState.LEFT]: 'Left call',
};

export type RingingCallProps = {
  /**
   * Whether to include the current user in the list of members to show.
   * This prop is maintained for backward compatibility.
   * @default false.
   */
  includeSelf?: boolean;

  /**
   * The maximum number of members to show.
   * @default 3.
   */
  totalMembersToShow?: number;

  /**
   * Whether to show only relevant users based on call direction.
   * When true, caller sees recipients and callee sees caller.
   * When false, behaves according to original implementation.
   * @default true
   */
  showRelevantUsersOnly?: boolean;
};

export const RingingCall = (props: RingingCallProps) => {
  useRingSound();
  
  const { 
    includeSelf = false, 
    totalMembersToShow = 3,
    showRelevantUsersOnly = true
  } = props;
  
  const call = useCall();
  const { useCallCallingState, useCallMembers, useCallCreatedBy } = useCallStateHooks();
  const creator = useCallCreatedBy();
  const callingState = useCallCallingState();
  const members = useCallMembers();
  const connectedUser = useConnectedUser();

  if (!call) return null;

  const isIncomingCall = !call.isCreatedByMe;
  let membersToShow: UserResponse[] = [];
  
  if (showRelevantUsersOnly) {
    if (isIncomingCall) {
      const caller = members.find(({ user }) => user.id === creator?.id)?.user;
      if (caller) {
        membersToShow = [caller];
      }
    } else {
      membersToShow = (members || [])
        .filter(({ user }) => user.id !== connectedUser?.id)
        .slice(0, totalMembersToShow)
        .map(({ user }) => user);
    }
  } else {
    membersToShow = (members || [])
      .slice(0, totalMembersToShow)
      .map(({ user }) => user)
      .filter((user) => user.id !== connectedUser?.id || includeSelf);
    
    if (
      includeSelf &&
      !membersToShow.find((user) => user.id === connectedUser?.id)
    ) {
      const self = members.find(({ user }) => user.id === connectedUser?.id);
      if (self) {
        membersToShow.splice(0, 1, self.user);
      }
    }
  }

  const callingStateLabel = CALLING_STATE_TO_LABEL[callingState];
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
  
  if (isIncomingCall) {
    const caller = membersToShow[0] || {};
    const location = "A. S. Fortuna St, Mandaue City"; 
    
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          width: '550px',
          margin: '0 auto',
          borderRadius: '20px',
          overflow: 'hidden',
          padding: 0
        }}
      >
        <div style={{ 
          backgroundColor: '#1e4976', 
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            marginRight: '24px', 
            borderRadius: '50%',
            backgroundColor: '#235182',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <img 
              src={medicalIcon}
              alt="Medical Symbol" 
              style={{ borderRadius: '50%', width: '80px', height: '80px' }}
            />
          </div>
          <div>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              MEDICAL INCIDENT
            </Typography>
            <Typography variant="body1" sx={{ color: 'white' }}>
              {location}
            </Typography>
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#4a7ab8', 
          padding: '28px 40px 28px 40px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
              {caller.name?.toUpperCase() || 'CALLER'}
            </Typography>
            <Typography variant="h6" sx={{ color: 'white' }}>
              {location}
            </Typography>
          </div>
          <Avatar 
            alt={caller.name} 
            src={caller.image}
            sx={{ width: 96, height: 96 }}
          >
            {caller.name?.[0]}
          </Avatar>
        </div>
        <div style={{ 
          backgroundColor: '#1e4976', 
          padding: '24px', 
          display: 'flex', 
          justifyContent: 'center',
          gap: '16px'
        }}>
          {[CallingState.RINGING, CallingState.JOINING].includes(callingState) && (
            <>
              <Button 
                variant="contained" 
                startIcon={<CallIcon />}
                disabled={buttonsDisabled}
                onClick={handleAccept}
                sx={{ 
                  backgroundColor: '#6ad37a',
                  color: 'white',
                  padding: '12px 24px',
                  width: '40%',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#5bc26b'
                  },
                  '&:disabled': {
                    backgroundColor: '#97d8a1',
                    color: '#e0e0e0'
                  }
                }}
              >
                ACCEPT
              </Button>
              <Button 
                variant="contained" 
                startIcon={<CallEndIcon />}
                disabled={buttonsDisabled}
                onClick={handleDecline}
                sx={{ 
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  padding: '12px 24px',
                  width: '40%',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#c0392b'
                  },
                  '&:disabled': {
                    backgroundColor: '#e57f73',
                    color: '#e0e0e0'
                  }
                }}
              >
                DECLINE
              </Button>
            </>
          )}
        </div>
      </Paper>
    );
  }
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        padding: 4,
        maxWidth: '550px',
        margin: '0 auto',
        backgroundColor: '#f5f5f5',
        borderRadius: '16px',
        textAlign: 'center'
      }}
    >
      <Typography variant="h5" fontWeight="bold" mb={3}>
        {isIncomingCall ? 'Incoming Call' : 'Calling...'}
      </Typography>
      
      <div className="flex justify-center items-center gap-4 mb-4 flex-wrap">
        {membersToShow.map((user) => (
          <div key={user.id} className="flex flex-col items-center">
            <Avatar 
              alt={user.name} 
              src={user.image}
              sx={{ width: 80, height: 80, mb: 1 }}
            >
              {user.name?.[0]}
            </Avatar>
            {user.name && (
              <Typography variant="subtitle1" fontWeight="medium">
                {user.name}
              </Typography>
            )}
          </div>
        ))}
      </div>

      {callingStateLabel && (
        <Typography 
          variant="h6" 
          color="text.secondary" 
          mb={3}
          sx={{
            animation: callingState === CallingState.RINGING ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 0.6 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.6 }
            }
          }}
        >
          {callingStateLabel}
        </Typography>
      )}

      {[CallingState.RINGING, CallingState.JOINING].includes(callingState) && (
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
      )}
    </Paper>
  );
};