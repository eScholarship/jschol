import React from 'react'
import { Link } from 'react-router'
import Form from 'react-router-form'
import { Subscriber } from 'react-broadcast'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import Nav1Comp from '../components/Nav1Comp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class LoginPage extends PageBase
{
  pageDataURL() { return null /* no API data */ }

  render() { 
    return(
    <div>
      <Header1Comp/>
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
            <Subscriber channel="adminLogin">
              { adminLogin =>
                <Form to={this.props.location.prevPathname || '/loginSuccess'} method="POST" 
                      onSubmit={(e,data) => this.onSubmit(e, data, adminLogin.onLogin)}>
                  <label htmlFor="login-username" style={{display: "inline-block", width: "6em"}}>User name:&#160;</label>
                  <input type="text" id="login-username" ref={el=> el && el.focus()}/> {/* Set initial focus */}
                  <br/>
                  <label htmlFor="login-password" style={{display: "inline-block", width: "6em"}}>Password:&#160;</label>
                  <input type="password" id="login-password"/>
                  <br/> <br/>
                  <button type="submit" aria-label="Log in">Submit</button>
                </Form>
              }
            </Subscriber>
          </section>
        </main>
      </div>
      <FooterComp/>
    </div>
  )}

  // In the future, we'll replace this with actual secure transaction to the server.
  // For now, just simulate a transaction with a short pause.
  onSubmit = (e, data, onLogin) =>
    setTimeout(()=>onLogin(data['login-username'], "xyz123"), 500)
}

module.exports = LoginPage
