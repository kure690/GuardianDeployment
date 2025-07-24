import React from 'react';
import { Modal, Paper, Avatar, Typography, Button } from '@mui/material';
import medicalIcon from '../assets/images/Medical.png';
import generalIcon from '../assets/images/General.png';
import fireIcon from '../assets/images/Fire.png';
import crimeIcon from '../assets/images/Police.png';

interface IncidentModalProps {
  open: boolean;
  onClose: () => void;
  incident: {
    _id: string;
    incidentType: string;
    user: {
      firstName: string;
      lastName: string;
      profileImage: string;
    };
  };
  address: string;
  onAccept: () => void;
  userName: string;
}

const getIncidentType = (incidentType: string) => {
  const type = incidentType?.toLowerCase() || '';
  switch (type) {
    case 'medical':
      return {
        primary: '#1e4976',
        secondary: '#4a7ab8',
        icon: medicalIcon
      };
    case 'fire':
      return {
        primary: '#1e4976',
        secondary: '#F27572',
        icon: fireIcon
      };
    case 'police':
      return {
        primary: '#1e4976',
        secondary: '#333333',
        icon: crimeIcon
      };
    case 'general':
    default:
      return {
        primary: '#1e4976',
        secondary: '#66bb6a',
        icon: generalIcon
      };
  }
};

const IncidentModal: React.FC<IncidentModalProps> = ({ open, onClose, incident, address, onAccept, userName }) => {
  const colors = getIncidentType(incident.incidentType);
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="incident-modal"
      aria-describedby="incident-description"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Paper 
        elevation={3} 
        className="shake_me"
        sx={{ 
          width: '600px',
          margin: '0 auto',
          borderRadius: '20px',
          overflow: 'hidden',
          padding: 0
        }}
      >
        <div style={{ 
          backgroundColor: colors.primary, 
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
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Avatar 
              src={colors.icon}
              sx={{ width: 96, height: 96 }}
              alt={colors.icon}
            />
          </div>
          <div>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              {incident.incidentType.toUpperCase()} INCIDENT
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'white',
              maxWidth: '300px',
              display: '-webkit-box',
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={address || "Loading address..."}>
              {address || "Loading address..."}
            </Typography>
          </div>
        </div>
        <div style={{ 
          backgroundColor: colors.secondary, 
          padding: '14px 40px 14px 40px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', maxWidth: '400px', }}>
              {incident.user.firstName.toUpperCase()} {incident.user.lastName.toUpperCase()}
            </Typography>
            <Typography variant="h6" sx={{ 
              color: 'white', 
              maxWidth: '390px',
              display: '-webkit-box',
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={address || "Loading address..."}>
              {address || "Loading address..."}
            </Typography>
          </div>
          <Avatar 
            src={incident.user.profileImage || ''}
            sx={{ width: 120, height: 120 }}
            alt={userName}
          />
        </div>
        <div style={{ 
          backgroundColor: colors.primary, 
          padding: '24px', 
          display: 'flex', 
          justifyContent: 'center',
          gap: '16px'
        }}>
          <Button 
            variant="contained" 
            onClick={onAccept}
            sx={{ 
              backgroundColor: '#6ad37a',
              color: 'white',
              padding: '5px 24px',
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
        </div>
      </Paper>
    </Modal>
  );
};

export default IncidentModal; 