// ##### Promo Component ##### //

import React from 'react'

class PromoComp extends React.Component {
  constructor(){
    super()
    this.state = {messageClose: false}
  }
  render() {
    return (
      <div className={this.state.messageClose ? "c-promo--close" : "c-promo"} role="alert" hidden={this.state.messageClose ? true : false}>
        <strong className="c-promo__main-text"><a href="/celebrateeschol">eScholarship turns 20! Learn More &gt;</a></strong>
      </div>
    )
  }
}

module.exports = PromoComp;
