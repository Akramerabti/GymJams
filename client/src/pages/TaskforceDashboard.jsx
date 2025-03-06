import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import Applications from '../pages/Taskforce/Applications';
import Support from '../pages/Taskforce/Support';
import Products from '../pages/Taskforce/Products';
import useAuthStore from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import InventoryManagement from '../pages/Taskforce/InventoryManagement';


const TaskforceDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);  // ✅ Fix: Define activeTab state
  const [products, setProducts] = useState([]);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const getUserrole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  useEffect(() => {
    if (getUserrole(user) !== 'admin' && getUserrole(user) !== 'taskforce') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Taskforce Dashboard</h1>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="Taskforce Dashboard Tabs">
          <Tab label="Products" />
          <Tab label="Applications" />
          <Tab label="Support" />
          <Tab label="Inventory Management" />
          
        </Tabs>
      </Box>
      <div className="mt-6">
        {activeTab === 0 && <Products />}
        {activeTab === 1 && <Applications />}
        {activeTab === 2 && <Support />}
        {activeTab === 3 && <InventoryManagement/>}
        
      </div>
    </div>
  );
};

export default TaskforceDashboard;
