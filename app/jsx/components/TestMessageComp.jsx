// ##### Test Message Component ##### //

import React from 'react'

class TestMessageComp extends React.Component {
  render() {
    return (
      <div className="c-testmessage" style={{display:"flex", justifyContent:"space-between"}}>
        <strong className="c-testmessage__main-text" style={{textTransform:"none", wordSpacing: 0}}>
          This is a beta preview of the new eScholarship
        </strong>
        <div style={{display:"flex", flexWrap: "wrap", marginLeft: "10px"}}>
          <a style={{color:"white"}} href="http://help.escholarship.org/support/discussions/forums/9000203294">
            Send us your feedback
          </a>
          &#160;&#160;&#160;
          <a style={{color:"white"}} href="http://escholarship.org">
            Return to current site
          </a>
        </div>
      </div>
    )
  }
}

module.exports = TestMessageComp;
