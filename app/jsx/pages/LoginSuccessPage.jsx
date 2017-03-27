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
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return `/api/loginValidate?nonce=${props.location.query.nonce}&data=${props.location.query.data}`
  }

  renderData() {
    // start is something like:  https://submit.escholarship.org/secure/jscholLogin?nonce=1234567890ABCDEF&returnTo=http%3A%2F%2Flocalhost%3A4001%2FloginSuccess
    // return is something like: http://localhost:4001/loginSuccess?data=fQpdFQ7Ah+UscNPkgSA9PtQ07BcPplF/ggKvNDIrjrHvIwC9gt73X7I61lGq%0APGv1w3aBBbwtcYLtt0EFfktWd/QYr6Z+6YamJyO5bDM1mzXDcPJcakuBfljg%0A8qXi
    return(
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
              { adminLogin => {
                  let username = adminLogin.username
                  if (!adminLogin.username) {
                    // On client, update global state (but avoid doing this on iso server)
                    if (!(typeof document === "undefined"))
                      setTimeout(()=>adminLogin.onLogin(this.state.pageData['username'], this.state.pageData['key']), 0)
                    username = this.state.pageData['username']
                  }
                  return <p>You are logged in as '{username}'.</p>
                }
              }
            </Subscriber>
          </section>
        </main>
      </div>
    </div>
  )}
}

module.exports = LoginSuccessPage
