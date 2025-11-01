import React from 'react';
import { Box, CircularProgress, Skeleton, Grid } from '@mui/material';

interface LoadingStateProps {
  variant?: 'page' | 'table' | 'card' | 'chart';
  rows?: number;
}

const LoadingState: React.FC<LoadingStateProps> = ({ variant = 'page', rows = 5 }) => {
  if (variant === 'page') {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (variant === 'table') {
    return (
      <Box>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            height={52}
            sx={{ mb: 1, borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }

  if (variant === 'card') {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (variant === 'chart') {
    return (
      <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
    );
  }

  return null;
};

export default LoadingState;
