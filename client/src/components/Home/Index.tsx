// src/components/Home/Index.tsx
import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Index: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to HouseMate
        </Typography>
        
        <Typography variant="h5" color="textSecondary" paragraph>
          Manage your household inventory efficiently
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            component={RouterLink}
            to="/register"
            variant="contained"
            color="primary"
          >
            Register
          </Button>
          
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            color="primary"
          >
            Login
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            component={RouterLink}
            to="/items"
            variant="text"
          >
            View Items
          </Button>
          
          <Button
            component={RouterLink}
            to="/stores"
            variant="text"
          >
            View Stores
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Index;