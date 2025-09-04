import React from 'react';
import { Modal, Paper, Typography, CircularProgress, Box, Button } from '@mui/material';

// Define the types for the component's props
interface ConnectingResponderModalProps {
  open: boolean;
  onClose: () => void; // Function to handle closing the modal
  responderName: string;
}

const ConnectingResponderModal: React.FC<ConnectingResponderModalProps> = ({ open, onClose, responderName }) => {
  return (
    <Modal
      open={open}
      onClose={onClose} // Allow closing by clicking the backdrop
      aria-labelledby="connecting-responder-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper 
        elevation={5} 
        sx={{ 
          padding: 4, 
          borderRadius: 2, 
          textAlign: 'center',
          maxWidth: '400px',
          outline: 'none',
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          Dispatching Responder...
        </Typography>
        <Typography sx={{ mt: 2, mb: 3 }}>
          Waiting for a response from **{responderName}**.
        </Typography>
        <CircularProgress sx={{ mb: 3 }} />
        <Button 
          variant="outlined" 
          color="error"
          onClick={onClose}
          fullWidth
        >
          Cancel Dispatch
        </Button>
      </Paper>
    </Modal>
  );
};

export default ConnectingResponderModal;
