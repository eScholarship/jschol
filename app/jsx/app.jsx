
// ##### Top-level React App ##### //

import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, IndexRoute, Link, browserHistory } from 'react-router'

import Home from './pages/home.jsx'
import Apples from './pages/apples.jsx'
import Oranges from './pages/oranges.jsx'
import Pears from './pages/pears.jsx'
import UnitPage from './pages/unit.jsx';
import ItemPage from './pages/item.jsx';

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
        <Link to="/unit/root">Units</Link>&nbsp;|&nbsp;
        <Link to="/item/1234">Item</Link>
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

const routes = (
  <Route path="/demo.html" component={App}>
    <IndexRoute component={Home}/>
    <Route path="/apples" component={Apples} />
    <Route path="/oranges" component={Oranges} />
    <Route path="/pears" component={Pears} />
    <Route path="/unit/:unitID" component={UnitPage} />
    <Route path="/item/:itemID" component={ItemPage} />
  </Route>
)

if (!(typeof document === "undefined")) {
  ReactDOM.render((
    <Router history={browserHistory}>
      {routes}
    </Router>
  ), document.getElementById('main'))
}

module.exports = routes
