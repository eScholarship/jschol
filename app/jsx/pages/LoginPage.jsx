import React from 'react'
import { Link } from 'react-router'
import Form from 'react-router-form'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import Nav1Comp from '../components/Nav1Comp.jsx'
import FooterComp from '../components/FooterComp.jsx'

let sessionStorage = (typeof window != "undefined") ? window.sessionStorage : null

class LoginPage extends PageBase
{
  pageDataURL(props) { return null /* no API data */ }

  render() { 
    return(
    <div>
      <Header1Comp admin={this.state.admin}/>
      <Nav1Comp/>
      <div className="c-columns">
        <aside>
          <section className="o-columnbox2 c-sidebarnav">
            <header>
              <h1 className="o-columnbox2__heading">About Logging In</h1>
            </header>
            <p>
              Department, journal, and series administrators may log in here 
              to modify layout and content of their eScholarship site(s).
            </p>
          </section>
        </aside>
        <main>
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">Log In</h1>
            </header>
            <Form to={this.props.location.prevPathname || '/loginSuccess'} method="POST" onSubmit={(e,data) => this.onSubmit(e, data)}>
              <label htmlFor="login-username" style={{display: "inline-block", width: "6em"}}>User name:&#160;</label>
              <input type="text" id="login-username" ref={el=> el && el.focus()}/> {/* Set initial focus */}
              <br/>
              <label htmlFor="login-password" style={{display: "inline-block", width: "6em"}}>Password:&#160;</label>
              <input type="password" id="login-password"/>
              <br/> <br/>
              <button type="submit" aria-label="Log in">Submit</button>
            </Form>
          </section>
        </main>
      </div>
      <FooterComp admin={this.state.admin}/>
    </div>
  )}

  // Record login info directly in the browser's sessionStorage, so it'll stick around
  // through page reloads.
  onSubmit(e, data) {
    // In the future, we'll replace this with actual secure stuff.
    sessionStorage.setItem('admin', JSON.stringify({ 
      username: data['login-username'],
      token: "xyz123" 
    }))
  }
}

module.exports = LoginPage
