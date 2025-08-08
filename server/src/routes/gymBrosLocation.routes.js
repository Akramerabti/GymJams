import express from 'express';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';
import * as gymBrosLocationController from '../controllers/gymBrosLocationController.js';

const router = express.Router();

router.post('/check', gymBrosLocationController.checkLocation);
router.get('/location-check', gymBrosLocationController.checkLocationLegacy);
router.post('/update', gymBrosLocationController.updateLocation);
router.put('/location', gymBrosLocationController.updateLocationLegacy);
router.get('/location-recommendations', gymBrosLocationController.getLocationRecommendations);
router.get('/gyms/search', gymBrosLocationController.searchGyms);
router.post('/gyms', optionalAuthenticate, gymBrosLocationController.createGym);
router.post('/gyms/associate', gymBrosLocationController.associateWithGym);
router.get('/gyms/my-gyms', gymBrosLocationController.getUserGyms);
router.get('/groups/nearby', gymBrosLocationController.getNearbyGroups);
router.post('/groups/location', gymBrosLocationController.createLocationGroup);

export default router;