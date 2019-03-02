import React from 'react'
import { Link } from 'react-router-dom'
//import Form from 'react-router-form'
import Contexts from '../contexts.jsx'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import MetaTagsComp from '../components/MetaTagsComp.jsx'

class LoginSuccessPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return `/api/loginValidate${props.location.search}`
  }

  renderData(data) {
    // start is something like:  https://submit.escholarship.org/secure/jscholLogin?nonce=1234567890ABCDEF&returnTo=http%3A%2F%2Flocalhost%3A4001%2FloginSuccess
    // return is something like: http://localhost:4001/loginSuccess?data=fQpdFQ7Ah+UscNPkgSA9PtQ07BcPplF/ggKvNDIrjrHvIwC9gt73X7I61lGq%0APGv1w3aBBbwtcYLtt0EFfktWd/QYr6Z+6YamJyO5bDM1mzXDcPJcakuBfljg%0A8qXi
    return(
    <div>
      <MetaTagsComp title="Login Success"/>
      <Header1Comp/>
      <div className="c-navbar">
        <NavComp data={data.header.nav_bar} />
      </div>
      <div className="c-columns">
        <main id="maincontent" tabIndex="-1">
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">Login Success</h1>
            </header>
            <Contexts.CMS.Consumer>
              { cms => {
                  let username = cms.username
                  if (!username) {
                    if (!(typeof document === "undefined")) {
                      // On client, update global state (but avoid doing this on iso server)
                      setTimeout(()=>cms.onLogin(this.state.pageData['username'], this.state.pageData['key']), 0)

                      // Return to the page whence the user originally came, if any
                      if (this.props.match.params[0])
                        setTimeout(()=>this.props.history.push("/" + this.props.match.params[0]), 1000)
                    }
                    username = this.state.pageData['username']
                  }
                  return (
                    <div>
                      <p>You are logged in as '{username}'.</p>
                      {this.props.match.params[0] &&
                        <p>Returning to where you left off...</p>
                      }
                    </div>
                  )
                }
              }
            </Contexts.CMS.Consumer>
          </section>
        </main>
      </div>
    </div>
  )}
}

module.exports = LoginSuccessPage
