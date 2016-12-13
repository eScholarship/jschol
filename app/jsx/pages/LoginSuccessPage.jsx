import React from 'react'
import { Link } from 'react-router'
import Form from 'react-router-form'

import PageBase from './PageBase.jsx'
import HeaderComp from '../components/HeaderComp.jsx'
import NavComp from '../components/NavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

let sessionStorage = (typeof window != "undefined") ? window.sessionStorage : null

class LoginSuccessPage extends PageBase
{
  pageDataURL(props) { return null /* no API data */ }

  handlePageEntry(nextState, replaceState) {
    console.log("nextState=", nextState)
  }

  render() { return(
    <div>
      <HeaderComp loggedIn={this.state.loggedIn}/>
      <NavComp/>
      <div className="c-columns">
        <main>
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">Login Success</h1>
            </header>
            <p>
            You are logged in as '{this.state.loggedIn.username}'.
            </p>
          </section>
        </main>
      </div>
      <FooterComp loggedIn={this.state.loggedIn}/>
    </div>
  )}
}

module.exports = LoginSuccessPage
