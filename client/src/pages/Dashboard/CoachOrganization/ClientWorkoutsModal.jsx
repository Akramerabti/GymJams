import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import  Textarea  from '@/components/ui/textarea';
import { 
  X, Save, Plus, Check, Trash2, Award, 
  Dumbbell, Calendar, CheckCircle, Clock,
  AlertTriangle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ClientWorkoutsModal = ({ client, onClose, onSave }) => {
  const [workouts, setWorkouts] = useState([]);
  const [history, setHistory] = useState([]);
  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [newWorkout, setNewWorkout] = useState({
    title: '',
    date: '',
    time: '',
    type: 'strength',
    description: '',
    exercises: []
  });
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: 3,
    reps: 10,
    weight: '',
    notes: ''
  });

  // Initialize workouts from client prop
  useEffect(() => {
    if (client && client.workouts) {
      setWorkouts(client.workouts);
    } else {
      // Set some default workouts if none exist
      setWorkouts([
        {
          id: 'workout-1',
          title: 'Upper Body Strength',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          time: '09:00',
          type: 'strength',
          description: 'Focus on upper body strength and muscle development.',
          exercises: [
            { id: 'ex-1', name: 'Bench Press', sets: 3, reps: 10, weight: '135', notes: '' },
            { id: 'ex-2', name: 'Shoulder Press', sets: 3, reps: 10, weight: '95', notes: '' },
            { id: 'ex-3', name: 'Bicep Curls', sets: 3, reps: 12, weight: '30', notes: '' }
          ],
          completed: false
        }
      ]);
    }

    // Initialize workout history
    if (client && client.workoutHistory) {
      setHistory(client.workoutHistory);
    } else {
      // Set some example history if none exists
      const today = new Date();
      setHistory([
        {
          id: 'hist-1',
          title: 'Lower Body Strength',
          date: new Date(today.setDate(today.getDate() - 3)).toISOString().split('T')[0],
          time: '10:00',
          type: 'strength',
          description: 'Focus on lower body strength and muscle development.',
          exercises: [
            { id: 'ex-1', name: 'Squats', sets: 3, reps: 10, weight: '185', notes: '' },
            { id: 'ex-2', name: 'Deadlifts', sets: 3, reps: 8, weight: '225', notes: '' },
            { id: 'ex-3', name: 'Leg Press', sets: 3, reps: 12, weight: '270', notes: '' }
          ],
          completed: true,
          feedback: 'Great job! Increased weight on all exercises.',
          performance: 'excellent'
        }
      ]);
    }
  }, [client]);

  const handleAddWorkout = () => {
    // Validate required fields
    if (!newWorkout.title || !newWorkout.date || !newWorkout.time) {
      return;
    }

    const workoutId = `workout-${Date.now()}`;
    const workout = {
      ...newWorkout,
      id: workoutId,
      exercises: newWorkout.exercises.map((exercise, index) => ({
        ...exercise,
        id: `${workoutId}-ex-${index}`
      })),
      completed: false
    };

    setWorkouts([...workouts, workout]);
    
    // Reset form
    setNewWorkout({
      title: '',
      date: '',
      time: '',
      type: 'strength',
      description: '',
      exercises: []
    });
    
    setIsAddingWorkout(false);
  };

  const handleAddExercise = () => {
    // Validate required fields
    if (!newExercise.name) {
      return;
    }

    const exercise = {
      ...newExercise,
      id: `temp-ex-${Date.now()}`
    };

    setNewWorkout({
      ...newWorkout,
      exercises: [...newWorkout.exercises, exercise]
    });

    // Reset exercise form
    setNewExercise({
      name: '',
      sets: 3,
      reps: 10,
      weight: '',
      notes: ''
    });
  };

  const handleRemoveExercise = (exerciseId) => {
    setNewWorkout({
      ...newWorkout,
      exercises: newWorkout.exercises.filter(exercise => exercise.id !== exerciseId)
    });
  };

  const handleCompleteWorkout = (workoutId) => {
    // Move from workouts to history
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;

    const completedWorkout = {
      ...workout,
      completed: true,
      completedDate: new Date().toISOString(),
      feedback: '',
      performance: 'good'
    };

    setHistory([completedWorkout, ...history]);
    setWorkouts(workouts.filter(w => w.id !== workoutId));
  };

  const handleDeleteWorkout = (workoutId) => {
    setWorkouts(workouts.filter(workout => workout.id !== workoutId));
  };

  const handleSaveAll = () => {
    onSave({
      workouts,
      workoutHistory: history
    });
  };

  const handleWorkoutInputChange = (e) => {
    const { name, value } = e.target;
    setNewWorkout({ ...newWorkout, [name]: value });
  };

  const handleExerciseInputChange = (e) => {
    const { name, value } = e.target;
    setNewExercise({ ...newExercise, [name]: value });
  };
  
  const handleTypeChange = (value) => {
    setNewWorkout({ ...newWorkout, type: value });
  };
  
  const handlePerformanceChange = (workoutId, value) => {
    setHistory(history.map(workout => 
      workout.id === workoutId 
        ? { ...workout, performance: value }
        : workout
    ));
  };

  const handleFeedbackChange = (workoutId, value) => {
    setHistory(history.map(workout => 
      workout.id === workoutId 
        ? { ...workout, feedback: value }
        : workout
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl overflow-hidden shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Dumbbell className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">
              {client.firstName}'s Workouts
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-6">
            <Button
              variant={activeTab === 'upcoming' ? 'default' : 'outline'}
              onClick={() => setActiveTab('upcoming')}
              className="flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming Workouts
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'outline'}
              onClick={() => setActiveTab('history')}
              className="flex items-center"
            >
              <Clock className="w-4 h-4 mr-2" />
              Workout History
            </Button>
          </div>

          {/* Upcoming Workouts Tab */}
          {activeTab === 'upcoming' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Scheduled Workouts</h3>
                <Button
                  onClick={() => setIsAddingWorkout(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isAddingWorkout}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Workout
                </Button>
              </div>

              {/* Add New Workout Form */}
              {isAddingWorkout && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 p-4 rounded-lg border border-blue-100"
                >
                  <h4 className="font-semibold text-lg mb-4 text-blue-800">Add New Workout</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title*
                      </label>
                      <Input
                        type="text"
                        name="title"
                        value={newWorkout.title}
                        onChange={handleWorkoutInputChange}
                        placeholder="e.g., Upper Body Strength"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <Select
                        value={newWorkout.type}
                        onValueChange={handleTypeChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select workout type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Workout Type</SelectLabel>
                            <SelectItem value="strength">Strength</SelectItem>
                            <SelectItem value="cardio">Cardio</SelectItem>
                            <SelectItem value="hiit">HIIT</SelectItem>
                            <SelectItem value="flexibility">Flexibility</SelectItem>
                            <SelectItem value="recovery">Recovery</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date*
                      </label>
                      <Input
                        type="date"
                        name="date"
                        value={newWorkout.date}
                        onChange={handleWorkoutInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time*
                      </label>
                      <Input
                        type="time"
                        name="time"
                        value={newWorkout.time}
                        onChange={handleWorkoutInputChange}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <Textarea
                        name="description"
                        value={newWorkout.description}
                        onChange={handleWorkoutInputChange}
                        placeholder="Describe the workout objectives..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Exercises Section */}
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-800 mb-2">Exercises</h5>
                    
                    {newWorkout.exercises.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {newWorkout.exercises.map((exercise, index) => (
                          <div 
                            key={exercise.id} 
                            className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
                          >
                            <div>
                              <p className="font-medium">{exercise.name}</p>
                              <p className="text-sm text-gray-600">
                                {exercise.sets} sets × {exercise.reps} reps
                                {exercise.weight && ` @ ${exercise.weight} lbs`}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExercise(exercise.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add Exercise Form */}
                    <div className="bg-white p-3 rounded-lg border">
                      <h6 className="font-medium text-gray-800 mb-2">Add Exercise</h6>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="col-span-2">
                          <Input
                            type="text"
                            name="name"
                            value={newExercise.name}
                            onChange={handleExerciseInputChange}
                            placeholder="Exercise name"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              name="sets"
                              value={newExercise.sets}
                              onChange={handleExerciseInputChange}
                              placeholder="Sets"
                              min="1"
                              className="w-full"
                            />
                            <span className="text-gray-500">sets</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              name="reps"
                              value={newExercise.reps}
                              onChange={handleExerciseInputChange}
                              placeholder="Reps"
                              min="1"
                              className="w-full"
                            />
                            <span className="text-gray-500">reps</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="text"
                              name="weight"
                              value={newExercise.weight}
                              onChange={handleExerciseInputChange}
                              placeholder="Weight (optional)"
                              className="w-full"
                            />
                            <span className="text-gray-500">lbs</span>
                          </div>
                        </div>
                        <div>
                          <Button 
                            onClick={handleAddExercise}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingWorkout(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddWorkout}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={!newWorkout.title || !newWorkout.date || !newWorkout.time}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Workout
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Workouts List */}
              {workouts.length > 0 ? (
                <div className="space-y-4">
                  {workouts
                    .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
                    .map((workout) => (
                      <motion.div
                        key={workout.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-4 rounded-lg border shadow-sm"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{workout.title}</h4>
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(workout.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {workout.time}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {workout.type.charAt(0).toUpperCase() + workout.type.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div className="flex mt-4 md:mt-0 space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCompleteWorkout(workout.id)}
                              className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteWorkout(workout.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        
                        {workout.description && (
                          <p className="text-gray-600 mb-4">{workout.description}</p>
                        )}
                        
                        <div className="space-y-2">
                          {workout.exercises.map((exercise) => (
                            <div
                              key={exercise.id}
                              className="bg-gray-50 p-3 rounded-lg"
                            >
                              <p className="font-medium">{exercise.name}</p>
                              <p className="text-sm text-gray-600">
                                {exercise.sets} sets × {exercise.reps} reps
                                {exercise.weight && ` @ ${exercise.weight} lbs`}
                              </p>
                              {exercise.notes && (
                                <p className="text-sm text-gray-500 mt-1">{exercise.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Workouts Scheduled</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Add a new workout to build a schedule for this client.
                  </p>
                  <Button
                    onClick={() => setIsAddingWorkout(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Workout
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Workout History</h3>
              
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((workout) => (
                      <motion.div
                        key={workout.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-4 rounded-lg border shadow-sm"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{workout.title}</h4>
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(workout.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {workout.time}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                {workout.type.charAt(0).toUpperCase() + workout.type.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0">
                            <Select
                              value={workout.performance || 'good'}
                              onValueChange={(value) => handlePerformanceChange(workout.id, value)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Performance" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="excellent" className="text-green-600">
                                  <div className="flex items-center">
                                    <Award className="w-4 h-4 mr-2" />
                                    Excellent
                                  </div>
                                </SelectItem>
                                <SelectItem value="good" className="text-blue-600">
                                  <div className="flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Good
                                  </div>
                                </SelectItem>
                                <SelectItem value="fair" className="text-orange-600">
                                  <div className="flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Fair
                                  </div>
                                </SelectItem>
                                <SelectItem value="poor" className="text-red-600">
                                  <div className="flex items-center">
                                    <X className="w-4 h-4 mr-2" />
                                    Poor
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          {workout.exercises.map((exercise) => (
                            <div
                              key={exercise.id}
                              className="bg-gray-50 p-3 rounded-lg"
                            >
                              <p className="font-medium">{exercise.name}</p>
                              <p className="text-sm text-gray-600">
                                {exercise.sets} sets × {exercise.reps} reps
                                {exercise.weight && ` @ ${exercise.weight} lbs`}
                              </p>
                              {exercise.notes && (
                                <p className="text-sm text-gray-500 mt-1">{exercise.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Feedback
                          </label>
                          <Textarea
                            value={workout.feedback || ''}
                            onChange={(e) => handleFeedbackChange(workout.id, e.target.value)}
                            placeholder="Add feedback on this workout..."
                            rows={3}
                            className="w-full"
                          />
                        </div>
                      </motion.div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Workout History</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Complete some workouts to build a history for this client.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAll}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ClientWorkoutsModal;