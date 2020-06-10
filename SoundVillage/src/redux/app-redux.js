
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

//
// Initial State
//

const initialState = {
    favoriteAnimal: "duck",
};

//
// Reducer...
//

const reducer = (state = initialState, action) => {

    return state;

};

//
//Store...
//

const store = createStore(reducer, applyMiddleware(thunkMiddleware));
export { store };