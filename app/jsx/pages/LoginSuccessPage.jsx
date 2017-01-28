import React from 'react'
import { Link } from 'react-router'
import Form from 'react-router-form'
import { Subscriber } from 'react-broadcast'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import Nav1Comp from '../components/Nav1Comp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class LoginSuccessPage extends PageBase
{
  pageDataURL(props) { return null /* no API data */ }

  render() { return(
    <div>
      <Header1Comp/>
      <Nav1Comp />
      <div className="c-columns">
        <main>
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">Login Success</h1>
            </header>
            <Subscriber channel="adminLogin">
              { adminLogin => <p>You are logged in as '{adminLogin.username}'.</p> }
            </Subscriber>
          </section>
        </main>
      </div>
      <FooterComp/>
    </div>
  )}
}

module.exports = LoginSuccessPage
