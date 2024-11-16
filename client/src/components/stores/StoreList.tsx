// src/components/stores/StoreList.tsx
import { useState, useEffect } from 'react';
import { List, ListItem, ListItemText, Typography, Box } from '@mui/material';
import api from '../../services/api';
import { Store } from '../../types';
import React from 'react';

export default function StoreList() {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await api.get('/stores');
        setStores(response.data);
      } catch (error) {
        console.error('Failed to fetch stores:', error);
      }
    };
    fetchStores();
  }, []);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Stores</Typography>
      <List>
        {stores.map((store) => (
          <ListItem key={store._id}>
            <ListItemText 
              primary={store.name}
              secondary={`${store.location}${store.contact ? ` - ${store.contact}` : ''}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}