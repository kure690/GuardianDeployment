import React from 'react';
import { Modal, Paper, Typography } from '@mui/material';

interface ConnectingModalProps {
  open: boolean;
  onClose: () => void;
  connectingOpCenName: { firstName: string; lastName: string } | null;
}

const ConnectingModal: React.FC<ConnectingModalProps> = ({ open, onClose, connectingOpCenName }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="connecting-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        bgcolor: 'transparent',
        backdropFilter: 'none',
        boxShadow: 'none',
        '& .MuiBackdrop-root': {
          backgroundColor: 'transparent',
          opacity: 0
        }
      }}
    >
      <div style={{
        backgroundColor: "rgba(220, 53, 69, 0.4)",
        width: '100%',
        height: 'fit-content',
        borderTop: '1px solid white',
        borderBottom: '1px solid white',
      }}
      >
        <Paper
          elevation={3}
          sx={{
            width: '550px',
            margin: '0 auto',
            overflow: 'hidden',
            padding: 0
          }}
        >
          <div style={{
            backgroundColor: "#1e4976",
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                CONNECTING...
              </Typography>
            </div>
          </div>
          <div style={{
            backgroundColor: "#ffffff",
            padding: '14px 40px 14px 40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {connectingOpCenName && (
              <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold', mb: 3 }}>
                {connectingOpCenName.firstName} {connectingOpCenName.lastName} Command Center
              </Typography>
            )}
          </div>
          <div style={{
            backgroundColor: "#1e4976",
            padding: '24px',
            display: 'flex',
            justifyContent: 'center',
            gap: '16px'
          }}>
          </div>
        </Paper>
      </div>
    </Modal>
  );
};

export default ConnectingModal; 