import { combineReducers } from "redux";
import ProfileReducer from "./profile_reducer";

const rootReducer = combineReducers({
 profile : ProfileReducer
});

export default rootReducer;