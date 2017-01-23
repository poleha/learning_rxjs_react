import React, {PropTypes, Component} from "react";
import ReactDOM from "react-dom";
import {connect, Provider} from "react-redux";
import {createStore, applyMiddleware, bindActionCreators, combineReducers} from "redux";
import {createEpicMiddleware, combineEpics} from "redux-observable";
import "rxjs/add/operator/delay";
import "rxjs/add/operator/mapTo";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/takeUntil";
//import {ajax} from 'rxjs/observable/dom/ajax';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import request from "superagent";
import Rx from "rxjs/Rx";

console.clear();


const PING = 'PING';
const PONG = 'PONG';

const START = 'START';
const SUCCESS = 'SUCCESS';
const FAILURE = 'FAILURE';
const CANCEL = 'CANCEL';

const CHANGE = 'CHANGE';


const ping = () => ({type: PING});


const start = () => ({type: START});
const success = (response) => {
    console.log(response)
    return {type: SUCCESS}
};
const failure = () => ({type: FAILURE});
const cancel = () => ({type: CANCEL});

const change = (value) => ({type: CHANGE, payload: value});

const pingEpic = action$ =>
    action$.ofType(PING)
        .delay(1000) // Asynchronously wait 1000ms then continue
        .mapTo({type: PONG});


const fetchApi = url => {
    //let response = request.get(url);
    //return response;

    let promise = new Promise((resolve, reject) => {

        setTimeout(() => {
            resolve("result");
        }, 2000);

    });
    return promise;

}

const testEpic = action$ =>
    action$.ofType(START)
        .mergeMap(action =>
            Rx.Observable.fromPromise(
                fetchApi(`/api/users/${action.payload}`)
            )
                .map(response => success(response))
                .takeUntil(action$.ofType(CANCEL))
                .catch(error => Observable.of({type: 'FAILURE', error}))
        );


const pingReducer = (state = {isPinging: false}, action) => {
    switch (action.type) {
        case PING:
            return {isPinging: true};

        case PONG:
            return {isPinging: false};

        default:
            return state;
    }
};


const testReducer = (state = {isFetching: false}, action) => {
    switch (action.type) {
        case START:
            return {isFetching: true};

        case SUCCESS:
            return {isFetching: false};

        case FAILURE:
            return {isFetching: false};

        case CANCEL:
            return {isFetching: false};

        default:
            return state;
    }
};

const rootEpic = combineEpics(
    pingEpic,
    testEpic
);

const rootReducer = combineReducers({
    ping: pingReducer,
    test: testReducer
});


// components/App.js

function mapStateToProps(state) {
    return {
        isPinging: state.ping.isPinging,
        isFetching: state.test.isFetching
    }
}

function mapDispatchToProps(dispatch) {
    return {
        ping: bindActionCreators(ping, dispatch),
        start: bindActionCreators(start, dispatch),
        success: bindActionCreators(success, dispatch),
        failure: bindActionCreators(failure, dispatch),
        cancel: bindActionCreators(cancel, dispatch),
        change: bindActionCreators(change, dispatch)
    }
}

@connect(mapStateToProps, mapDispatchToProps)
class App extends Component{

    onTextChange(e) {
        this.props.change(e.target.value);
    }

    render() {
        return (
            <div>
                <h1>is pinging: {this.props.isPinging.toString()}</h1>
                <button onClick={this.props.ping}>Start PING</button>
                <h1>is fetching: {this.props.isFetching.toString()}</h1>
                <button onClick={this.props.start}>Start Fetch</button>
                <button onClick={this.props.cancel}>Cancel Fetch</button>
                <input onChange={this.onTextChange.bind(this)} type="text"/>
            </div>

        )
    }
}



// redux/configureStore.js


const logger = store => next => action => {
    console.log(action)
    next(action)
}

const epicMiddleware = createEpicMiddleware(rootEpic);

const store = createStore(rootReducer,
    applyMiddleware(epicMiddleware, logger)
);

// index.js

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);
