import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { 
  X, Save, Plus, Check, Trash2, Award, Info,
  Dumbbell, Calendar, CheckCircle, Clock,
  AlertTriangle, Activity, Target
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
  const [workoutPrograms, setWorkoutPrograms] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [isAddingProgram, setIsAddingProgram] = useState(false);
  const [activeTab, setActiveTab] = useState('programs');
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [newProgram, setNewProgram] = useState({
    name: '',
    description: '',
    workouts: []
  });
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    muscleGroup: '',
    exercises: []
  });
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: 3,
    reps: 10,
    weight: '',
    notes: ''
  });

  // Initialize workout programs and history from client prop
  useEffect(() => {
    if (client && client.workoutPrograms) {
      setWorkoutPrograms(client.workoutPrograms.filter(program => !program.completed));
      setWorkoutHistory(client.workoutPrograms.filter(program => program.completed));
    } else {
      // Set default data if none exists
      setWorkoutPrograms([]);
      setWorkoutHistory([]);
    }
  }, [client]);

  // Add a new workout program
  const handleAddProgram = () => {
    if (!newProgram.name || newProgram.workouts.length === 0) return;

    const programId = `program-${Date.now()}`;
    const program = {
      ...newProgram,
      id: programId,
      completed: false,
      createdAt: new Date().toISOString()
    };

    setWorkoutPrograms([...workoutPrograms, program]);

    // Reset form
    setNewProgram({
      name: '',
      description: '',
      workouts: []
    });
    setIsAddingProgram(false);
  };

  // Add a new workout to the program
  const handleAddWorkout = () => {
    if (!newWorkout.name || !newWorkout.muscleGroup || newWorkout.exercises.length === 0) return;

    const workoutId = `workout-${Date.now()}`;
    const workout = {
      ...newWorkout,
      id: workoutId,
      exercises: newWorkout.exercises.map((exercise, index) => ({
        ...exercise,
        id: `${workoutId}-ex-${index}`
      }))
    };

    setNewProgram({
      ...newProgram,
      workouts: [...newProgram.workouts, workout]
    });

    // Reset workout form
    setNewWorkout({
      name: '',
      muscleGroup: '',
      exercises: []
    });
  };

  // Add a new exercise to the workout
  const handleAddExercise = () => {
    if (!newExercise.name) return;

    const exercise = {
      ...newExercise,
      id: `ex-${Date.now()}`
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

  // Remove an exercise from the workout
  const handleRemoveExercise = (exerciseId) => {
    setNewWorkout({
      ...newWorkout,
      exercises: newWorkout.exercises.filter(exercise => exercise.id !== exerciseId)
    });
  };

  // Complete a workout program
  const handleCompleteProgram = (programId) => {
    const program = workoutPrograms.find(p => p.id === programId);
    if (!program) return;

    const completedProgram = {
      ...program,
      completed: true,
      completedDate: new Date().toISOString()
    };

    setWorkoutHistory([completedProgram, ...workoutHistory]);
    setWorkoutPrograms(workoutPrograms.filter(p => p.id !== programId));
  };

  // Delete a workout program
  const handleDeleteProgram = (programId) => {
    setWorkoutPrograms(workoutPrograms.filter(program => program.id !== programId));
  };

  // Save all changes
  const handleSaveAll = () => {
    const allPrograms = [...workoutPrograms, ...workoutHistory];
    onSave(allPrograms);
    onClose();
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
              {client.firstName}'s Workout Programs
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClientProfile(!showClientProfile)}
              className="ml-2"
            >
              <Info className="w-4 h-4 mr-2" />
              {showClientProfile ? 'Hide Profile' : 'View Profile'}
            </Button>
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

        {/* Client Profile Section (Collapsible) */}
        {showClientProfile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border-b border-blue-100 p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Fitness Profile</h3>
                <div className="space-y-1 text-black text-sm">
                  <p><span className="font-medium">Level:</span> {client.fitnessProfile?.level || 'Not specified'}</p>
                  <p><span className="font-medium">Experience:</span> {client.fitnessProfile?.experience || 'Not specified'}</p>
                  <p><span className="font-medium">Equipment:</span> {client.fitnessProfile?.hasEquipment ? 'Yes' : 'No'}</p>
                  <p><span className="font-medium">Energy:</span> {client.fitnessProfile?.energyLevel || 'Medium'}/10</p>
                  <p><span className="font-medium">Sleep:</span> {client.fitnessProfile?.sleepHours || '7-8'} hours</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Goals & Preferences</h3>
                <div className="space-y-1 text-black text-sm">
                  <p><span className="font-medium">Goals:</span> {(client.fitnessProfile?.goals || []).join(', ') || 'Not specified'}</p>
                  <p><span className="font-medium">Training Days:</span> {client.fitnessProfile?.frequency || 3} per week</p>
                  <p><span className="font-medium">Preferred Times:</span> {(client.fitnessProfile?.preferredTimes || []).join(', ') || 'Not specified'}</p>
                  <p><span className="font-medium">Weekly Target:</span> {client.stats?.weeklyTarget || 3} workouts</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Recommendations</h3>
                <div className="space-y-1 text-black text-sm">
                  <p><span className="font-medium">Recommended:</span> {(client.fitnessProfile?.recommendedWorkouts || []).join(', ') || 'Strength training'}</p>
                  <p><span className="font-medium">Schedule:</span> {client.fitnessProfile?.preferredSchedule || 'Morning workouts'}</p>
                  <p><span className="font-medium">Nutrition:</span> {client.fitnessProfile?.nutritionProfile || 'Balanced diet'}</p>
                  <p className="flex items-center">
                    <span className="font-medium mr-1">Adherence Risk:</span> 
                    <span className={`${
                      client.stats?.adherenceRisk === 'high' ? 'text-red-600' : 
                      client.stats?.adherenceRisk === 'medium' ? 'text-amber-600' : 
                      'text-green-600'
                    }`}>
                      {client.stats?.adherenceRisk || 'Low'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-6">
            <Button
              variant={activeTab === 'programs' ? 'default' : 'outline'}
              onClick={() => setActiveTab('programs')}
              className="flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Workout Programs
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

          {/* Workout Programs Tab */}
          {activeTab === 'programs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Workout Programs</h3>
                <Button
                  onClick={() => setIsAddingProgram(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isAddingProgram}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Program
                </Button>
              </div>

              {/* Add New Program Form */}
              {isAddingProgram && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 p-4 rounded-lg border border-blue-100"
                >
                  <h4 className="font-semibold text-lg mb-4 text-blue-800">Add New Workout Program</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program Name*
                      </label>
                      <Input
                        type="text"
                        value={newProgram.name}
                        onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                        placeholder="e.g., Full Body Strength"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <Textarea
                        value={newProgram.description}
                        onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                        placeholder="Describe the program objectives..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Workouts Section */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-gray-800">Workouts</h5>
                    </div>
                    
                    {newProgram.workouts.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {newProgram.workouts.map((workout) => (
                          <div 
                            key={workout.id} 
                            className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
                          >
                            <div>
                              <p className="font-medium">{workout.name}</p>
                              <p className="text-sm text-gray-600">
                                {workout.muscleGroup}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setNewProgram({
                                ...newProgram,
                                workouts: newProgram.workouts.filter(w => w.id !== workout.id)
                              })}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add Workout Form */}
                    <div className="bg-white p-3 rounded-lg border">
                      <h6 className="font-medium text-gray-800 mb-2">Add Workout</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                        <div>
                          <Input
                            type="text"
                            value={newWorkout.name}
                            onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
                            placeholder="Workout name"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Select
                            value={newWorkout.muscleGroup}
                            onValueChange={(value) => setNewWorkout({ ...newWorkout, muscleGroup: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select muscle group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Legs">Legs</SelectItem>
                              <SelectItem value="Chest">Chest</SelectItem>
                              <SelectItem value="Arms">Arms</SelectItem>
                              <SelectItem value="Back">Back</SelectItem>
                              <SelectItem value="Shoulders">Shoulders</SelectItem>
                              <SelectItem value="Core">Core</SelectItem>
                              <SelectItem value="Full Body">Full Body</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Exercises Section */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h6 className="font-medium text-gray-800">Exercises</h6>
                        </div>
                        
                        {newWorkout.exercises.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {newWorkout.exercises.map((exercise) => (
                              <div 
                                key={exercise.id} 
                                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{exercise.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {exercise.sets} sets × {exercise.reps} reps
                                    {exercise.weight && ` @ ${exercise.weight}`}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setNewWorkout({
                                    ...newWorkout,
                                    exercises: newWorkout.exercises.filter(e => e.id !== exercise.id)
                                  })}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Add Exercise Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          <div>
                            <Input
                              type="text"
                              value={newExercise.name}
                              onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                              placeholder="Exercise name"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                value={newExercise.sets}
                                onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
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
                                value={newExercise.reps}
                                onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
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
                                value={newExercise.weight}
                                onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
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
                              Add Exercise
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setNewWorkout({
                            name: '',
                            muscleGroup: '',
                            exercises: []
                          })}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddWorkout}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={!newWorkout.name || !newWorkout.muscleGroup || newWorkout.exercises.length === 0}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Workout
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingProgram(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddProgram}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={!newProgram.name || newProgram.workouts.length === 0}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Program
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Workout Programs List */}
              {workoutPrograms.length > 0 ? (
                <div className="space-y-4">
                  {workoutPrograms.map((program) => (
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-4 rounded-lg border shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{program.name}</h4>
                          <p className="text-sm text-gray-600">{program.description}</p>
                        </div>
                        <div className="flex mt-4 md:mt-0 space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteProgram(program.id)}
                            className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProgram(program.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {program.workouts.map((workout) => (
                          <div
                            key={workout.id}
                            className="bg-gray-50 p-3 rounded-lg"
                          >
                            <p className="font-medium">{workout.name}</p>
                            <p className="text-sm text-gray-600">{workout.muscleGroup}</p>
                            <div className="space-y-2 mt-2">
                              {workout.exercises.map((exercise) => (
                                <div
                                  key={exercise.id}
                                  className="bg-white p-2 rounded-lg"
                                >
                                  <p className="font-medium">{exercise.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {exercise.sets} sets × {exercise.reps} reps
                                    {exercise.weight && ` @ ${exercise.weight}`}
                                  </p>
                                </div>
                              ))}
                            </div>
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
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Workout Programs</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Add a new workout program to get started.
                  </p>
                  <Button
                    onClick={() => setIsAddingProgram(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Program
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Workout History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Workout History</h3>
              
              {workoutHistory.length > 0 ? (
                <div className="space-y-4">
                  {workoutHistory.map((program) => (
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-4 rounded-lg border shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{program.name}</h4>
                          <p className="text-sm text-gray-600">{program.description}</p>
                          <p className="text-sm text-gray-600">
                            Completed on: {new Date(program.completedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {program.workouts.map((workout) => (
                          <div
                            key={workout.id}
                            className="bg-gray-50 p-3 rounded-lg"
                          >
                            <p className="font-medium">{workout.name}</p>
                            <p className="text-sm text-gray-600">{workout.muscleGroup}</p>
                            <div className="space-y-2 mt-2">
                              {workout.exercises.map((exercise) => (
                                <div
                                  key={exercise.id}
                                  className="bg-white p-2 rounded-lg"
                                >
                                  <p className="font-medium">{exercise.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {exercise.sets} sets × {exercise.reps} reps
                                    {exercise.weight && ` @ ${exercise.weight}`}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
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
                    Complete some workout programs to build a history.
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