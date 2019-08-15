// ##### Test Message Component ##### //

import React from 'react'
import Contexts from '../contexts.jsx'

class TestMessageComp extends React.Component {
  render = () =>
    <Contexts.CMS.Consumer>
      { cms =>
        <div className="c-testmessage"
             style={{display:"flex", justifyContent:"space-between",
                     /* Total hack here to make the DrawerComp cooperate with the admin bar and test message */
                     marginTop: (cms.permissions && cms.permissions.admin && cms.modules) ? "-20px" : "-10px",
                     marginBottom: (cms.permissions && cms.permissions.admin && cms.modules) ? "20px" : "10px" }}>
          <strong className="c-testmessage__main-text" style={{textTransform:"none", wordSpacing: 0}}>
            This is a beta preview of the new eScholarship
          </strong>
          <div style={{display:"flex", flexWrap: "wrap", marginLeft: "10px"}}>
            <a style={{color:"white"}} href="https://help.escholarship.org/support/discussions/9000052123">
              Send us your feedback
            </a>
            &#160;&#160;&#160;
            <a style={{color:"white"}} href="http://escholarship.org">
              Return to current site
            </a>
          </div>
        </div>
      }
    </Contexts.CMS.Consumer>
}

export default TestMessageComp;
