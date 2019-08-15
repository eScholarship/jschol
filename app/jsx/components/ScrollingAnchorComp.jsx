// ##### Scrolling Anchor Component ##### //
// Used to trigger scrolling for anchors i.e. linked from JumpComp (i.e. 'article_abstract') //

import React from 'react'

class ScrollingAnchorComp extends React.Component {
  render() {
    return (
      <a name={this.props.name} ref={(domElement) => {
        if (domElement &&
          window.location.hash.toLowerCase().replace(/^#/, "") == this.props.name) {
            setTimeout(() => domElement.scrollIntoView(), 0)
          }
      }} />
   )
 }
}

export default ScrollingAnchorComp;
