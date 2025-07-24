// client/src/services/client.service.js
import api from './api';

const clientService = {
  // Get all clients for a coach
  async getCoachClients() {
    try {
      const response = await api.get('/client/coach-clients');
      //('Fetched coach clients:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching coach clients:', error);
      throw error;
    }
  },

  // Get a single client by ID
  async getClientById(clientId) {
    try {
      const response = await api.get(`/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching client ${clientId}:`, error);
      throw error;
    }
  },

  async awardClientPoints (clientId, points) {
    try {
      const response = await api.post(`/client/${clientId}/award-points`, { points });
      return response.data;
    } catch (error) {
      console.error('Failed to award points:', error);
      throw error;
    }
  },

  // Updated method for clientService.js
async requestSession(subscriptionId, sessionData) {
  try {
    if (!subscriptionId || !sessionData) {
      throw new Error('Missing required parameters');
    }
    
    // Log the request for debugging
    //(`Requesting session for subscription ${subscriptionId}:`, sessionData);
    
    // Make sure all required fields are present and properly named
    const payload = {
      ...sessionData,
      // Ensure the field name matches what the server expects
      sessionType: sessionData.sessionType || sessionData.type,
      // Make sure type is included as a fallback
      type: sessionData.type || sessionData.sessionType
    };
    
    // Add the guest token if it exists in the URL
    const params = {};
    const urlParams = new URLSearchParams(window.location.search);
    const guestToken = urlParams.get('guestToken');
    if (guestToken) {
      params.guestToken = guestToken;
    }
    
    // Call the API endpoint with query parameters
    const response = await api.post(
      `/subscription/${subscriptionId}/request-session`, 
      payload,
      { params }
    );
    
    //('Session request successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to request session:', error);
    throw error;
  }
},

  // Update client stats
  async updateClientStats(clientId, statsData) {
    try {
      const response = await api.put(`/client/${clientId}/stats`, statsData);
      return response.data;
    } catch (error) {
      console.error(`Error updating client ${clientId} stats:`, error);
      throw error;
    }
  },

  // Update client progress
  async updateClientProgress(clientId, progressData) {
    try {
      const response = await api.put(`/client/${clientId}/progress`, progressData);
      return response.data;
    } catch (error) {
      console.error(`Error updating client ${clientId} progress:`, error);
      throw error;
    }
  },

  // Update client workouts
  async updateClientWorkouts(clientId, workouts) {
    try {
      const response = await api.put(`/client/${clientId}/workouts`, workouts);
      return response.data;
    } catch (error) {
      console.error(`Error updating client ${clientId} workouts:`, error);
      throw error;
    }
  },

  // Update client notes
  async updateClientNotes(clientId, notes) {
    try {
      const response = await api.put(`/client/${clientId}/notes`, { notes });
      return response.data;
    } catch (error) {
      console.error(`Error updating client ${clientId} notes:`, error);
      throw error;
    }
  },

  // Export client data
  async exportClientData(clientId) {
    try {
      const response = await api.get(`/client/${clientId}/export`);
      return response.data;
    } catch (error) {
      console.error(`Error exporting client ${clientId} data:`, error);
      throw error;
    }
  },

  // Get pending coach requests
  async getPendingRequests() {
    try {
      const response = await api.get('/client/pending-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw error;
    }
  },

  // Accept coaching request
  async acceptCoachingRequest(requestId) {
    try {
      const response = await api.post(`/client/accept-request/${requestId}`);
      return response.data;
    } catch (error) {
      console.error(`Error accepting request ${requestId}:`, error);
      throw error;
    }
  },

  // Decline coaching request
  async declineCoachingRequest(requestId, reason = '') {
    try {
      const response = await api.post(`/client/decline-request/${requestId}`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error declining request ${requestId}:`, error);
      throw error;
    }
  },

  // Session management
  // Get coach sessions
  async getCoachSessions() {
    try {
      const response = await api.get('/client/sessions');
      return response.data;
    } catch (error) {
      console.error('Error fetching coach sessions:', error);
      throw error;
    }
  },

  // Create new session
  async createSession(sessionData) {
    try {
      const response = await api.post('/client/sessions', sessionData);
      return response.data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  // Update session
  async updateSession(sessionId, sessionData) {
    try {
      const response = await api.put(`/client/sessions/${sessionId}`, sessionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating session ${sessionId}:`, error);
      throw error;
    }
  },

  // Delete session
  async deleteSession(sessionId) {
    try {
      const response = await api.delete(`/client/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      throw error;
    }
  },

  // Premium and Elite client features
  // Update nutrition data
  async updateNutritionData(clientId, nutritionData) {
    try {
      const response = await api.put(`/client/${clientId}/nutrition`, nutritionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating nutrition data for client ${clientId}:`, error);
      throw error;
    }
  },

  // Update advanced goals
  async updateAdvancedGoals(clientId, goals) {
    try {
      const response = await api.put(`/client/${clientId}/goals`, goals);
      return response.data;
    } catch (error) {
      console.error(`Error updating goals for client ${clientId}:`, error);
      throw error;
    }
  },

  // Elite-only: Update recovery metrics
  async updateRecoveryMetrics(clientId, recoveryData) {
    try {
      const response = await api.put(`/client/${clientId}/recovery`, recoveryData);
      return response.data;
    } catch (error) {
      console.error(`Error updating recovery metrics for client ${clientId}:`, error);
      throw error;
    }
  },

  // Elite-only: Add physique assessment
  async addPhysiqueAssessment(clientId, assessmentData) {
    try {
      const response = await api.post(`/client/${clientId}/physique-assessment`, assessmentData);
      return response.data;
    } catch (error) {
      console.error(`Error adding physique assessment for client ${clientId}:`, error);
      throw error;
    }
  },

  async getClientSessions(subscriptionId) {
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }
      
      const response = await api.get(`/subscription/${subscriptionId}/sessions`);
      
      // Process the response to ensure pending sessions are marked correctly
      if (response.data && response.data.data) {
        // Map through sessions to make sure isPending is set properly
        response.data.data = response.data.data.map(session => ({
          ...session,
          isPending: session.status === 'pending' || session.clientRequested === true
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch client sessions:', error);
      throw error;
    }
  },
  

  async addToCalendar(session) {
    try {
      if (!session || !session.date || !session.time) {
        throw new Error('Session date and time are required');
      }
      
      // This is a client-side only operation, no API call needed
      // We'll just generate the Google Calendar URL
      
      const title = `Coaching Session: ${session.type || 'Coaching'}`;
      const startDate = `${session.date}T${session.time}`;
      
      // Calculate end time (add 1 hour by default or use duration)
      let endTime = session.time;
      if (session.duration) {
        // Parse duration like "60 minutes"
        const durationMatch = session.duration.match(/(\d+)/);
        if (durationMatch) {
          const durationMinutes = parseInt(durationMatch[1], 10);
          
          // Split time into hours and minutes
          const [hours, minutes] = session.time.split(':').map(Number);
          
          // Calculate new time
          let newHours = hours + Math.floor(durationMinutes / 60);
          let newMinutes = minutes + (durationMinutes % 60);
          
          // Adjust for overflow
          if (newMinutes >= 60) {
            newHours += 1;
            newMinutes -= 60;
          }
          
          // Format with leading zeros
          endTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
        }
      } else {
        // Default: add 1 hour
        const [hours, minutes] = session.time.split(':').map(Number);
        endTime = `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
      
      const endDate = `${session.date}T${endTime}`;
      const description = `Coaching session${session.type ? ': ' + session.type : ''}${session.notes ? '\n\nNotes: ' + session.notes : ''}`;
      
      // Create Google Calendar URL
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate.replace(/[-:]/g, '')}Z/${endDate.replace(/[-:]/g, '')}Z&details=${encodeURIComponent(description)}`;
      
      return googleCalendarUrl;
    } catch (error) {
      console.error('Failed to generate calendar URL:', error);
      throw error;
    }
  },
  
  exportToCSV(sessions) {
    try {
      if (!sessions || !Array.isArray(sessions)) {
        throw new Error('Sessions array is required');
      }
      
      // Create CSV header
      let csvContent = "Session Type,Date,Time,Duration,Coach,Notes\n";
      
      // Add each session as a row
      sessions.forEach(session => {
        const type = session.type ? `"${session.type.replace(/"/g, '""')}"` : '';
        const date = session.date || '';
        const time = session.time || '';
        const duration = session.duration || '';
        const coach = session.coachName ? `"${session.coachName.replace(/"/g, '""')}"` : '';
        const notes = session.notes ? `"${session.notes.replace(/"/g, '""')}"` : '';
        
        csvContent += `${type},${date},${time},${duration},${coach},${notes}\n`;
      });
      
      return csvContent;
    } catch (error) {
      console.error('Failed to generate CSV:', error);
      throw error;
    }
  },

};

export default clientService;