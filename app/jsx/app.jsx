
// ##### Top-level React App ##### //

// ***** The vars below (when uncommented) are pulling in the NPM packages into bundle.js via Browserify, but they're not loading in the app, for some reason. ***** //

// var React = require('react');
// var ReactDOM = require('react-dom');
// var Router = require('react-router').Router
// var Route = require('react-router').Route
// var Link = require('react-router').Link

var Home = require('./pages/home.jsx');
var Apples = require('./pages/apples.jsx');
var Oranges = require('./pages/oranges.jsx');
var Pears = require('./pages/pears.jsx');
var UnitPage = require('./pages/unit.jsx');

// var App = React.createClass({
// render: function() {

class App extends React.Component {
  render() {
    return (
      <div>
      <p>
        <strong>Header</strong>
      </p>
      <div>
        <Link to="/demo.html">Home</Link>&nbsp;|&nbsp;
        <Link to="/apples">Apples</Link>&nbsp;|&nbsp;
        <Link to="/oranges">Oranges</Link>&nbsp;|&nbsp;
        <Link to="/pears">Pears</Link>&nbsp;|&nbsp;
        <Link to="/unit/root">Units</Link>
        </div>
        <hr />
        {this.props.children}
        <hr />
        <p>
          <strong>Footer</strong>
        </p>
      </div>
    )
  }
}

const { // set React Router prefixes:
  Router,
  Route,
  IndexRoute,
  Redirect,
  Link,
  IndexLink,
  browserHistory
} = ReactRouter

ReactDOM.render((
  <Router history={browserHistory}>
    <Route path="/demo.html" component={App}>
      <IndexRoute component={Home}/>
      <Route path="/apples" component={Apples} />
      <Route path="/oranges" component={Oranges} />
      <Route path="/pears" component={Pears} />
      <Route path="/unit/:unitID" component={UnitPage} fribble="bar"/>
    </Route>
  </Router>
), document.getElementById('main'))
