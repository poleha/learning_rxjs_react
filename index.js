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
import 'rxjs/add/observable/from';
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

// AUTH
const AUTH_START = 'AUTH_START';
const AUTH_SUCCESS = 'AUTH_SUCCESS';
const AUTH_FAILURE = 'AUTH_FAILURE';


const authStart = (data) => ({type: AUTH_START, data});

const obtainAuthToken = (data) => {
    console.log(data, 'obtainAuthToken');
    return Observable.fromPromise(request.post('http://localhost:8000/api/v1/obtain_auth_token/', data));
};

const getUserInfo = (token) => {
    console.log(token, 'getUserInfo')
    return Observable.fromPromise(request
        .get('http://localhost:8000/api/v1/get_user_info/')
        .set('Authorization', `Token ${token}`)
    );
}

const getUserInfoSuccess = (response) => {
    console.log(response, 'getUserInfoSuccess');
    return Observable.of(response);
}


const getUserInfoFailure = (response) => {
    console.log(response, 'getUserInfoFailure');
    return Observable.of(response)
}

const authEpic = action$ =>
    action$.ofType(AUTH_START)
        .mergeMap(action =>
            obtainAuthToken(action.data)
                .delay(300)
                .flatMap(response => getUserInfo(response.body.token))
                .delay(300)
                .flatMap(response => getUserInfoSuccess(response))
                .delay(300)
                .catch(error => getUserInfoFailure(error))
        )
        //.takeUntil(action$.ofType(AUTH_FAILURE))
        //.flatMap(result => {
        //    if (result.statusCode == 200) return Observable.of({type: AUTH_SUCCESS})
        //    else return Observable.of({type: AUTH_FAILURE})
        //});
        .map(result => {
            if (result.statusCode == 200) return {type: AUTH_SUCCESS}
            else return {type: AUTH_FAILURE}
        });
//.mapTo({type: AUTH_SUCCESS})

//.map(action => obtainAuthToken(action.data))
//.map(response => console.log(response))


class Auth extends Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            password: ''
        }

    }

    handleUsernameChange(e) {
        this.setState({username: e.target.value});
    }

    handlePasswordChange(e) {
        this.setState({password: e.target.value});
    }

    handleFormSubmit(e) {
        e.preventDefault();
        this.props.authStart({
            username: this.state.username,
            password: this.state.password
        })
    }

    render() {
        return (
            <form onSubmit={this.handleFormSubmit.bind(this)}>
                <input type="text" value={this.state.username} onChange={this.handleUsernameChange.bind(this)}/>
                <input type="password" value={this.state.password} onChange={this.handlePasswordChange.bind(this)}/>
                <input type="submit"/>
            </form>
        )
    }
}


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
        .delay(1000)
        .mergeMap(action =>
            Rx.Observable.fromPromise(
                fetchApi(`/api/users/${action.payload}`)
            ).map(response => success(response))
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


const authReducer = (state = {isLogging: false}, action) => {
    switch (action.type) {
        case AUTH_START:
            return {isLogging: true};

        case AUTH_SUCCESS:
            return {isLogging: false};

        case AUTH_FAILURE:
            return {isLogging: false};

        default:
            return state;
    }
};

const rootEpic = combineEpics(
    pingEpic,
    testEpic,
    authEpic
);

const rootReducer = combineReducers({
    ping: pingReducer,
    test: testReducer,
    auth: authReducer
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
        change: bindActionCreators(change, dispatch),
        authStart: bindActionCreators(authStart, dispatch)
    }
}

@connect(mapStateToProps, mapDispatchToProps)
class App extends Component {

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
                <Auth authStart={this.props.authStart}/>
            </div>

        )
    }
}


// redux/configureStore.js


const logger = store => next => action => {
    console.log(action, 'logger')
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
