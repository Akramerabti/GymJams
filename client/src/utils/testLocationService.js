// Test file to verify location service functionality
// Run this in browser console to test

import locationService from '../services/location.service.js';

const testLocationService = async () => {
  console.log('🧪 Testing Location Service...');

  // Test 1: IP-based location (no popup)
  try {
    console.log('\n1️⃣ Testing IP-based location detection...');
    const ipLocation = await locationService.getLocationByIP();
    console.log('✅ IP Location Result:', ipLocation);
  } catch (error) {
    console.error('❌ IP Location failed:', error);
  }

  // Test 2: Manual location geocoding
  try {
    console.log('\n2️⃣ Testing manual location geocoding...');
    const manualLocation = await locationService.geocodeManualLocation('New York, NY');
    console.log('✅ Manual Location Result:', manualLocation);
  } catch (error) {
    console.error('❌ Manual Location failed:', error);
  }

  // Test 3: Smart location detection
  try {
    console.log('\n3️⃣ Testing smart location detection...');
    const smartResult = await locationService.getLocationSmart();
    console.log('✅ Smart Location Result:', smartResult);
  } catch (error) {
    console.error('❌ Smart Location failed:', error);
  }

  // Test 4: Storage functionality
  try {
    console.log('\n4️⃣ Testing location storage...');
    const testLocation = {
      lat: 40.7128,
      lng: -74.0060,
      city: 'Test City',
      source: 'test',
      timestamp: new Date().toISOString()
    };
    
    const stored = locationService.storeLocation(testLocation);
    console.log('✅ Storage Result:', stored);
    
    const retrieved = locationService.getStoredLocation();
    console.log('✅ Retrieved Location:', retrieved);
    
    const isFresh = locationService.isLocationFresh(retrieved);
    console.log('✅ Is Fresh:', isFresh);
  } catch (error) {
    console.error('❌ Storage test failed:', error);
  }

  console.log('\n🏁 Location Service Tests Complete!');
};

// Export for testing
export default testLocationService;

// Usage in browser console:
// testLocationService();
