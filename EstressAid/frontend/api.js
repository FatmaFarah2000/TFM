import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = Platform.select({
  android: 'http://172.20.10.3:56956/api',
  ios: 'http://172.20.10.3:56956/api',
  default: 'http://172.20.10.3:56956/api',
} );

const BOT_API_BASE_URL = Platform.select({
  android: 'http://172.20.10.3:56956',
  ios: 'http://172.20.10.3:56956',
  default: 'http://172.20.10.3:56956',
} );


const getToken = async () => {
  return await AsyncStorage.getItem('access_token'); 
};


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const botApiClient = axios.create({
  baseURL: BOT_API_BASE_URL, 
  timeout: 200000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Error en interceptor de request (apiClient):", error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("Error de red o sin respuesta del servidor (apiClient):", error.message);
      return Promise.reject({ message: 'Error de conexión. Verifica tu red o la disponibilidad del servidor.', isNetworkError: true });
    }
    console.error('Error en respuesta de API (apiClient):', error.response.status, error.response.data);
    const message = error.response.data?.detail || error.message || 'Ocurrió un error inesperado.';
    if (error.response.status === 401) {
      console.warn("Error 401 (apiClient): No autorizado.");
      
    }
    return Promise.reject({ ...error.response.data, status: error.response.status, message });
  }
);

botApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("Error de red o sin respuesta del servidor (botApiClient):", error.message);
      return Promise.reject({ message: 'Error de conexión', isNetworkError: true });
    }
    console.error('Error en respuesta de API (botApiClient):', error.response.status, error.response.data);
    const message = error.response.data?.detail || error.response.data?.error || error.message || 'Error inesperado';
    return Promise.reject({ ...error.response.data, status: error.response.status, message });
  }
);




export const getUserProfile = async (userId) => {
  if (!userId) throw new Error("Se requiere userId para obtener el perfil.");
  try {
    
    console.log("Llamando a getUserProfile con userId:", userId, "Tipo:", typeof userId);

    const response = await apiClient.get(`/users/${userId}/app`); 
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo perfil para usuario ${userId}:`, error);
    throw error;
  }
};

export const updateUserProfile = async (userId, data) => {
  if (!userId) throw new Error("Se requiere userId para actualizar el perfil.");
 
  const backendFieldMap = {
    firstName: 'name',
    lastName: 'last_name',
    userName: 'user_name', 
    email: 'email',
    dateOfBirth: 'date_of_birth',
    gender: 'gender',
    password: 'password',
    new_password: 'new_password' 
  };

  const updateData = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      const backendKey = backendFieldMap[key] || key; 
      acc[backendKey] = value;
    }
    return acc;
  }, {});
  

  const filteredUpdateData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== null && v !== undefined && v !== '')
  );

  if (Object.keys(filteredUpdateData).length === 0) {
    console.log("No hay datos válidos para actualizar después del filtrado.");
    return; 
  }

  console.log("Datos mapeados y filtrados a enviar al backend:", filteredUpdateData);

  try {
    const response = await apiClient.put(`/users/${userId}/edit`, filteredUpdateData); 
    const updatedProfile = response.data; 
    if (updatedProfile) {
      const profileToStore = {
        firstName: updatedProfile.name ,
        lastName: updatedProfile.last_name ,
        userName: updatedProfile.user_name ,
        email: updatedProfile.email ,
        dateOfBirth: updatedProfile.date_of_birth ,
        gender: updatedProfile.gender ,
      };
      await AsyncStorage.setItem('user_profile', JSON.stringify(profileToStore));
      console.log("Perfil actualizado y guardado en AsyncStorage:", profileToStore);
    } else {
      console.warn("La respuesta PUT no contenía el perfil actualizado.");
 
    }
 

    return response.data; 
  } catch (error) {
    console.error(`Error actualizando perfil para usuario ${userId}:`, error.response ? error.response.data : error.message);
    throw error.response ? new Error(JSON.stringify(error.response.data)) : error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const loginResponse = await apiClient.post('/users/login', credentials);
    const { access_token, user_id, user_name } = loginResponse.data;
    if (access_token && user_id) {
      await AsyncStorage.setItem('access_token', access_token);
      await AsyncStorage.setItem('user_id', String(user_id));
      if (user_name) await AsyncStorage.setItem('user_name', user_name);
      try {
        const userProfile = await getUserProfile(user_id);
        if (userProfile) {
          const profileToStore = {
            firstName: userProfile.name || '',
            lastName: userProfile.last_name || '', 
            userName: userProfile.user_name || user_name || '',
            email: userProfile.email || credentials.email,
            dateOfBirth: userProfile.date_of_birth || '',
            gender: userProfile.gender || '',
          };
          await AsyncStorage.setItem('user_profile', JSON.stringify(profileToStore));
        } else {
          await AsyncStorage.removeItem('user_profile'); 
        }
      } catch (profileError) {
        console.error("Error fetching/saving full profile after login:", profileError);
        await AsyncStorage.removeItem('user_profile');
      }
    } else {
      throw new Error("Respuesta de login inválida del servidor.");
    }
    return loginResponse.data;
  } catch (error) {
    console.error('Error en loginUser:', error);
    await AsyncStorage.multiRemove(['access_token', 'user_id', 'user_name', 'user_profile']);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await AsyncStorage.multiRemove(['access_token', 'user_id', 'user_name', 'user_profile']);
    console.log('Usuario deslogueado, datos locales limpiados.');
  } catch (error) {
    console.error('Error en logoutUser:', error);
  }
};

export const createUser = async (userData) => {
  try {
    const response = await apiClient.post('/users/add', userData);
    return response.data;
  } catch (error) {
    console.error('Error en createUser:', error);
    throw error;
  }
};


export const requestPasswordReset = async (email) => {
 try {
   const response = await apiClient.post("/users/request-password-reset", { email });
   return response.data; 
 } catch (error) {
   console.error("Error en requestPasswordReset:", error.response?.data || error.message);
   
   throw error.response?.data || new Error("Error de red o del servidor"); 
 }
};


export const resetPasswordWithToken = async (token, newPassword) => {
 try {
   const response = await apiClient.post("/users/reset-password-with-token", {
     token: token,
     new_password: newPassword,
   });
   return response.data; 
 } catch (error) {
   console.error("Error en resetPasswordWithToken:", error.response?.data || error.message);
   const customError = new Error(error.response?.data?.detail || "Error de red o del servidor");
   customError.status = error.response?.status;
   throw customError; 
 }
};




export const saveConversation = async (userId, conversationData) => {
  if (!userId) throw new Error("Se requiere userId para guardar la conversación.");
  try {
    const response = await apiClient.post(`/users/${userId}/conversations`, conversationData);
    return response.data;
  } catch (error) {
    console.error(`Error guardando conversación para usuario ${userId}:`, error);
    throw error;
  }
};

export const getConversations = async (userId) => {
  if (!userId) throw new Error("Se requiere userId para obtener conversaciones.");
  try {
    
    const response = await apiClient.get(`/users/${userId}/conversations`); 
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo conversaciones para usuario ${userId}:`, error);
    throw error;
  }
};


const validateBotUserId = async (userId) => { 
  try {
   
    const response = await botApiClient.get(`/bot/validate_id?user_id=${userId}`);
    return response.data?.is_valid || false;
  } catch (error) {
    console.error("Error validating user ID:", error);
    return false;
  }
};

const sendMessageToBot = async (userId, message) => { 
  try {
    console.log(`Sending to bot endpoint: userId=${userId}, message=${message}`);
    const response = await botApiClient.post('/bot/', {
      user_id: String(userId), 
      message: message,
    });
    console.log("Bot response data:", response.data);
   
    return {
      response: response.data.response || "No se recibió respuesta.",
      topic: response.data.topic || "General",

    };
  } catch (error) {
    console.error("Error sending message", error);
  
    return {
      response: error.message || "Error al contactar.",
      topic: "Error",
      isError: true,
    };
  }
};


export const botService = {
  currentConversation: null,
  async startConversation(userId) {
    const finalUserId = userId || await AsyncStorage.getItem('user_id');
    if (!finalUserId) {
        console.error("Cannot start conversation without User ID");
        return false; 
    }
    try {
      console.log("Starting conversation with userId:", finalUserId);
      const isValid = await validateBotUserId(finalUserId);
      if (!isValid) {
          console.warn("User ID validation failed with backend.");
    
      }
      this.currentConversation = { userId: finalUserId, messages: [], startTime: new Date() };
      return true;
    } catch (error) {
      console.error("Error starting conversation:", error);
      this.currentConversation = { userId: finalUserId, messages: [], startTime: new Date(), validationFailed: true };
      return false;
    }
  },
  async sendMessage(message) {
    if (!this.currentConversation || !this.currentConversation.userId) {
       console.error("Cannot send message: No active conversation.");
       return { response: "Error: La conversación no se ha iniciado correctamente.", topic: "Error" };
    }
    try {
      console.log(`Sending message for user ${this.currentConversation.userId}: ${message}`);
  
      const botResult = await sendMessageToBot(this.currentConversation.userId, message);
      
      this.currentConversation.messages.push({ role: 'user', text: message, timestamp: new Date() });
      
      this.currentConversation.messages.push({
         role: 'bot', 
         text: botResult.response, 
         topic: botResult.topic || "General", 
         timestamp: new Date(),
         isError: botResult.isError || false 
      });
      
      return botResult; 
      
    } catch (error) {
 
      console.error("Unexpected error in botService.sendMessage:", error);
      const fallbackResponse = { response: "Ocurrió un error inesperado.", topic: "Error", isError: true };
      this.currentConversation.messages.push({ role: 'user', text: message, timestamp: new Date() });
      this.currentConversation.messages.push({ role: 'bot', text: fallbackResponse.response, topic: fallbackResponse.topic, timestamp: new Date(), isError: true });
      return fallbackResponse;
    }
  },
  async endConversation() {
    const conversation = this.currentConversation;
    this.currentConversation = null;
    if (conversation && conversation.userId && conversation.messages.length > 0) {
      console.log(`Ending conversation for user ${conversation.userId}. Saving ${conversation.messages.length} messages.`);
      try {
        const conversationData = {
          messages: conversation.messages, 
          topic: conversation.messages.find(m => m.topic && m.topic !== 'Error' && m.topic !== 'Connection Issue')?.topic || 'General',
        };
        await saveConversation(conversation.userId, conversationData);
        console.log("Conversación guardada exitosamente.");
      } catch (error) {
        console.error("Failed to save conversation:", error);
      }
    }
    return conversation;
  }
};

export default apiClient;

