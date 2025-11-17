import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  CircularProgress, 
  Alert, 
  Box 
} from '@mui/material';
import config from '../config';


// Define the type for a single video object
interface Video {
  filename: string;
  url: string;
  recordedAt: string;
}

function RecordingsPage() {
  // Get the 'callId' from the URL (e.g., /recordings/123)
  const { callId } = useParams<{ callId: string }>(); // Add type for useParams
  
  // State for your component
  const [videos, setVideos] = useState<Video[]>([]); // Use the Video interface
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // This hook runs when the component loads
  useEffect(() => {
    // Define the async function to fetch data
    const fetchRecordings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call your new API endpoint
        const response = await fetch(`${config.GUARDIAN_SERVER_URL}/recordings/${callId}`);

        if (!response.ok) {
          // Handle errors from the API (like 404 Not Found)
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to fetch recordings');
        }

        const data: Video[] = await response.json();
        // Sort videos by date, oldest first
        data.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
        setVideos(data); // Save the list of videos in state

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Call the function
    if (callId) {
      fetchRecordings();
    }
  }, [callId]); // Re-run this effect if the callId in the URL changes

  // Helper to format the date
  const formatTimestamp = (dateString: string): string => {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Call Recordings
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ wordBreak: 'break-all' }}>
          <strong>Call ID:</strong> {callId}
        </Typography>
      </Box>

      {/* --- 1. Show Loading State --- */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {/* --- 2. Show Error State --- */}
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {/* --- 3. Show Success/Empty State --- */}
      {!loading && !error && (
        <>
          {videos.length === 0 ? (
            <Typography variant="h6" align="center" sx={{ mt: 5 }}>
              No recordings found for this call.
            </Typography>
          ) : (
            videos.map((video, index) => (
              <Card sx={{ mb: 3 }} key={video.filename}>
                <CardContent>
                  <Typography variant="h6" component="h2">
                    Recording {index + 1}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {formatTimestamp(video.recordedAt)}
                  </Typography>
                  
                  <video controls width="100%" preload="metadata">
                    <source src={video.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </CardContent>
                <CardActions>
                  {/* The 'component="a"' tells MUI to render this as a link */}
                  <Button
                    variant="contained"
                    component="a"
                    href={video.url} 
                    download={video.filename} 
                  >
                    Download
                  </Button>
                </CardActions>
              </Card>
            ))
          )}
        </>
      )}
    </Container>
  );
}

export default RecordingsPage;