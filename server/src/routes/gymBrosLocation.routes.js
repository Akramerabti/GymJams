import express from 'express';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';
import * as gymBrosLocationController from '../controllers/gymBrosLocationController.js';

const router = express.Router();

// Legacy endpoints (keep for backward compatibility)
router.post('/check', gymBrosLocationController.checkLocation);
router.get('/location-check', gymBrosLocationController.checkLocationLegacy);
router.post('/update', gymBrosLocationController.updateLocation);
router.put('/location', gymBrosLocationController.updateLocationLegacy);
router.get('/location-recommendations', gymBrosLocationController.getLocationRecommendations);
router.get('/gyms/search', gymBrosLocationController.searchGyms);
router.post('/gyms/associate', gymBrosLocationController.associateWithGym);
router.get('/gyms/my-gyms', gymBrosLocationController.getUserGyms);
router.get('/groups/nearby', gymBrosLocationController.getNearbyGroups);
router.post('/groups/location', gymBrosLocationController.createLocationGroup);

router.get('/map/users', optionalAuthenticate, gymBrosLocationController.getMapUsers);
router.get('/gyms', optionalAuthenticate, gymBrosLocationController.getGymsForMap);
router.post('/gyms', optionalAuthenticate, gymBrosLocationController.createGym);

router.post('/realtime/location', optionalAuthenticate, gymBrosLocationController.updateUserLocationRealtime);
router.get('/realtime/updates', optionalAuthenticate, gymBrosLocationController.getMapUpdates);

router.get('/map/clusters', optionalAuthenticate, gymBrosLocationController.getMapClusters);

export default router;