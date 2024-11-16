// src/components/items/ItemList.tsx
import { useState, useEffect } from 'react';
import { List, ListItem, ListItemText, Typography, Box } from '@mui/material';
import api from '../../services/api';
import { Item } from '../../types';
import React from 'react';

export default function ItemList() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get('/items');
        setItems(response.data);
      } catch (error) {
        console.error('Failed to fetch items:', error);
      }
    };
    fetchItems();
  }, []);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Items</Typography>
      <List>
        {items.map((item) => (
          <ListItem key={item._id}>
            <ListItemText 
              primary={item.name}
              secondary={`${item.quantity} ${item.unit} - ${item.category}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}