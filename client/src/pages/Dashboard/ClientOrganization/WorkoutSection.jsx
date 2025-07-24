import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, CheckCircle, ArrowRight, Calendar, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import  Progress  from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Helper function for formatting dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Individual workout card component
const WorkoutCard = ({ workout, onComplete }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const isCompleted = workout.completed;
  const workoutDate = new Date(workout.date);
  const isToday = new Date().toDateString() === workoutDate.toDateString();
  const isPast = workoutDate < new Date() && !isToday;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-sm border p-4 ${isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-lg">{workout.title}</h3>
          <p className="text-sm text-gray-600">
            {formatDate(workout.date)} {workout.time && `• ${workout.time}`}
          </p>
        </div>
        <Badge 
          className={`
            ${isCompleted 
              ? 'bg-green-100 text-green-800 border-green-200' 
              : isToday 
                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                : isPast 
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-gray-100 text-gray-800 border-gray-200'
            }
          `}
        >
          {isCompleted 
            ? 'Completed' 
            : isToday 
              ? 'Today' 
              : isPast 
                ? 'Missed' 
                : formatDate(workout.date)}
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        {workout.description || `${workout.type || 'General'} workout with ${workout.exercises?.length || 0} exercises`}
      </p>
      
      {workout.exercises && workout.exercises.length > 0 && (
        <div className="space-y-2 mb-3">
          {workout.exercises.slice(0, 3).map((exercise, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{exercise.name}</span>
              <span className="text-gray-600">{exercise.sets} × {exercise.reps}</span>
            </div>
          ))}
          {workout.exercises.length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              +{workout.exercises.length - 3} more exercises
            </p>
          )}
        </div>
      )}
      
      <div className="flex justify-between">
        <Button
          variant="ghost" 
          size="sm"
          onClick={() => setShowDetails(true)}
          className="text-blue-600"
        >
          View Details
        </Button>
        
        {!isCompleted && (
          <Button 
            onClick={() => onComplete(workout)} 
            size="sm"
            className={isToday ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isToday ? "Complete" : "Mark Complete"}
          </Button>
        )}
      </div>
      
      {/* Workout Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{workout.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span>{formatDate(workout.date)}</span>
              </div>
              <div className="flex items-center">
                <Activity className="w-4 h-4 mr-2 text-gray-500" />
                <span>{workout.type || 'General'}</span>
              </div>
            </div>
            
            {workout.description && (
              <p className="text-gray-600 text-sm">{workout.description}</p>
            )}
            
            <div className="space-y-3 mt-4">
              <h4 className="font-medium text-gray-800">Exercises</h4>
              {workout.exercises && workout.exercises.length > 0 ? (
                workout.exercises.map((exercise, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <h5 className="font-medium">{exercise.name}</h5>
                      <span className="text-gray-600">{exercise.sets} × {exercise.reps}</span>
                    </div>
                    {exercise.weight && (
                      <p className="text-sm text-gray-600">Weight: {exercise.weight}</p>
                    )}
                    {exercise.notes && (
                      <p className="text-sm text-gray-500 mt-1">{exercise.notes}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No exercises specified for this workout.</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            {!isCompleted ? (
              <Button 
                onClick={() => {
                  onComplete(workout);
                  setShowDetails(false);
                }} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Completed
              </Button>
            ) : (
              <Button 
                onClick={() => setShowDetails(false)}
                variant="outline"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Main workout section component
const WorkoutSection = ({ workouts, stats, onCompleteWorkout, onViewAll }) => {
  // Filter for recent and upcoming workouts
  const upcomingWorkouts = workouts
    .filter(w => !w.completed && new Date(w.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);
    
  const recentCompletedWorkouts = workouts
    .filter(w => w.completed)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 2);
    
  const displayWorkouts = [...upcomingWorkouts, ...recentCompletedWorkouts]
    .sort((a, b) => {
      // First prioritize non-completed
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      
      // Then sort by date (upcoming first for non-completed, recent first for completed)
      if (a.completed) {
        return new Date(b.date) - new Date(a.date);
      } else {
        return new Date(a.date) - new Date(b.date);
      }
    })
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent & Upcoming Workouts</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onViewAll}
        >
          View All
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {displayWorkouts.length > 0 ? (
          <div className="space-y-4">
            {displayWorkouts.map(workout => (
              <WorkoutCard 
                key={workout.id || workout._id} 
                workout={workout} 
                onComplete={onCompleteWorkout} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Dumbbell className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-xl font-medium text-gray-700">No workouts yet</h3>
            <p className="text-gray-500 mt-2">Your coach will add workouts to your plan soon.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
            <p className="text-xl font-bold">
              {workouts.length > 0 
                ? Math.round((workouts.filter(w => w.completed).length / workouts.length) * 100) 
                : 0}%
            </p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">Weekly Target</p>
            <p className="text-xl font-bold">
              {stats?.weeklyTarget || 3}
            </p>
          </div>
          
          <div className="hidden sm:block bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">Current Streak</p>
            <p className="text-xl font-bold">
              {stats?.currentStreak || 0} days
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default WorkoutSection;