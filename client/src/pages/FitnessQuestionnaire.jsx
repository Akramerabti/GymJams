import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const FitnessQuestionnaire = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fitnessGoals: [],
    activityLevel: '',
    workoutFrequency: '',
    dietaryRestrictions: [],
    healthConditions: [],
    measurements: {
      height: '',
      weight: '',
      age: ''
    }
  });

  const steps = [
    {
      title: 'Fitness Goals',
      fields: ['fitnessGoals'],
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">What are your fitness goals?</h3>
          {['weight_loss', 'muscle_gain', 'endurance', 'flexibility'].map((goal) => (
            <div key={goal} className="flex items-center space-x-2">
              <Checkbox
                id={goal}
                checked={formData.fitnessGoals.includes(goal)}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    fitnessGoals: checked
                      ? [...prev.fitnessGoals, goal]
                      : prev.fitnessGoals.filter(g => g !== goal)
                  }));
                }}
              />
              <label htmlFor={goal} className="capitalize">
                {goal.replace('_', ' ')}
              </label>
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Activity Level',
      fields: ['activityLevel', 'workoutFrequency'],
      component: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">What's your activity level?</h3>
            <select
              className="w-full p-2 border rounded"
              value={formData.activityLevel}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                activityLevel: e.target.value
              }))}
            >
              <option value="">Select activity level</option>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="very_active">Very Active</option>
              <option value="extra_active">Extra Active</option>
            </select>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">
              How many times per week do you work out?
            </h3>
            <Input
              type="number"
              min="0"
              max="7"
              value={formData.workoutFrequency}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                workoutFrequency: e.target.value
              }))}
            />
          </div>
        </div>
      )
    },
    {
      title: 'Measurements',
      fields: ['measurements'],
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Measurements</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Height (cm)</label>
              <Input
                type="number"
                value={formData.measurements.height}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  measurements: {
                    ...prev.measurements,
                    height: e.target.value
                  }
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weight (kg)</label>
              <Input
                type="number"
                value={formData.measurements.weight}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  measurements: {
                    ...prev.measurements,
                    weight: e.target.value
                  }
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <Input
                type="number"
                value={formData.measurements.age}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  measurements: {
                    ...prev.measurements,
                    age: e.target.value
                  }
                }))}
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          subscriptionPlan: location.state.plan.id
        })
      });

      if (!response.ok) throw new Error('Failed to submit questionnaire');

      navigate('/subscription/checkout', {
        state: {
          plan: location.state.plan,
          questionnaireId: await response.json()
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit questionnaire. Please try again.",
        variant: "destructive"
      });
    }
  };

  const validateStep = (step) => {
    const { fields } = steps[step];
    return fields.every(field => {
      if (field === 'measurements') {
        return Object.values(formData[field]).every(value => value !== '');
      }
      return Array.isArray(formData[field])
        ? formData[field].length > 0
        : formData[field] !== '';
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="p-6">
      <div className="mb-8">
          <div className="flex justify-between mb-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center ${
                  index === currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div 
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    index === currentStep ? 'border-blue-600' : 'border-gray-200'
                  }`}
                >
                  <span>{index + 1}</span>
                </div>
                <span className="ml-2">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          {steps[currentStep].component}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button
            onClick={() => {
              if (currentStep === steps.length - 1) {
                handleSubmit();
              } else {
                setCurrentStep(prev => prev + 1);
              }
            }}
            disabled={!validateStep(currentStep)}
          >
            {currentStep === steps.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default FitnessQuestionnaire;