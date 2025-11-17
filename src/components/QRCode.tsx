import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Box } from '@mui/material';

// Define the component's props
interface Props {
  text: string; // The URL or text to encode
  size?: number; // The size of the QR code
}

const QRCodeComponent: React.FC<Props> = ({ text, size = 130 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Generate the QR code when the 'text' prop changes
    if (canvasRef.current && text) {
      QRCode.toCanvas(
        canvasRef.current, 
        text, 
        { width: size, margin: 1 }, // Options
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [text, size]);

  // Render a canvas element that the library will draw on
  return (
    <Box 
      component="canvas" 
      ref={canvasRef} 
      sx={{ 
        width: `${size}px !important`, 
        height: `${size}px !important` 
      }} 
    />
  );
};

export default QRCodeComponent;