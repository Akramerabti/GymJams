// components/dashboard/components/CoachAssignment.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Search, CheckCircle, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import subscriptionService from '../../../services/subscription.service';

const CoachAssignment = ({ subscription, onCoachAssigned }) => {
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [assignmentStatus, setAssignmentStatus] = useState('pending');

  const isBasicPlan = subscription?.type === 'basic';

  useEffect(() => {
    const initializeCoachAssignment = async () => {
      try {
        setLoading(true);
        if (isBasicPlan) {
          // For basic plan, get random coach assignment
          const response = await subscriptionService.assignRandomCoach();
          setSelectedCoach(response.coach);
          setAssignmentStatus('assigned');
        } else {
          // For premium/elite, fetch available coaches
          const response = await subscriptionService.getAvailableCoaches();
          setCoaches(response.coaches);
        }
      } catch (error) {
        console.error('Coach assignment error:', error);
        toast.error('Failed to initialize coach assignment');
      } finally {
        setLoading(false);
      }
    };

    initializeCoachAssignment();
  }, [isBasicPlan]);

  const handleCoachSelect = async (coach) => {
    try {
      setAssignmentStatus('pending');
      const response = await subscriptionService.assignCoach(coach.id);
      setSelectedCoach(coach);
      setAssignmentStatus('assigned');
      onCoachAssigned(coach);
      toast.success('Coach assigned successfully!');
    } catch (error) {
      console.error('Coach selection error:', error);
      toast.error('Failed to assign coach');
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
          />
        </CardContent>
      </Card>
    );
  }

  if (isBasicPlan) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Coach Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            {assignmentStatus === 'pending' ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mb-4"
                >
                  <Search className="w-12 h-12 text-blue-600 mx-auto" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">Finding Your Perfect Coach Match</h3>
                <p className="text-gray-600">Please wait while we assign you to one of our expert coaches...</p>
              </>
            ) : (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <h3 className="text-lg font-semibold">Coach Assigned!</h3>
                {selectedCoach && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      {selectedCoach.profileImage ? (
                        <img 
                          src={selectedCoach.profileImage} 
                          alt={selectedCoach.firstName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold">{selectedCoach.firstName} {selectedCoach.lastName}</h4>
                        <p className="text-sm text-gray-600">{selectedCoach.specialties?.join(', ')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="w-5 h-5 mr-2" />
          Choose Your Coach
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coaches.map((coach) => (
            <motion.div
              key={coach.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-50 rounded-lg p-4 cursor-pointer"
              onClick={() => handleCoachSelect(coach)}
            >
              <div className="flex items-center space-x-4">
                {coach.profileImage ? (
                  <img 
                    src={coach.profileImage} 
                    alt={coach.firstName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold">{coach.firstName} {coach.lastName}</h4>
                  <p className="text-sm text-gray-600">{coach.specialties?.join(', ')}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-yellow-500 mr-1">★</span>
                    <span className="text-sm text-gray-600">{coach.rating?.toFixed(1)} ({coach.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CoachAssignment;