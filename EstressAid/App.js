import { StyleSheet } from 'react-native';
import {useState} from "react"
import {Provider} from "react-redux"
import AppContainer from './AppContainer';
import AuthContext from './context/AuthContext';
import store from './redux/store/store';


export default function App() {
 const [user,setUser] = useState(null)
  return (
    <AuthContext.Provider  value={{user, setUser}} >
      <Provider  store={store()} >
  <AppContainer   />
  </Provider>
    </AuthContext.Provider>
  
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});