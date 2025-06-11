
import { configureStore } from '@reduxjs/toolkit'; 
import rootReducer from '../reducers/rootReducer';

const store = (initialState) => {
   
    return configureStore({
        reducer: rootReducer, 
        preloadedState: initialState, 
      });
    };

export default store;