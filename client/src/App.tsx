// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './components/Home/Index';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import ItemList from './components/items/ItemList';
import StoreList from './components/stores/StoreList';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/items" element={<ItemList />} />
          <Route path="/stores" element={<StoreList />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;