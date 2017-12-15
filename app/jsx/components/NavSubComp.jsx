// ##### Navigation Sub-component ##### //

import React from 'react'

class NavSubComp extends React.Component {
  render() {
    return (
      <details className="c-nav__sub" open={this.props.open} ref={(domNode)=> this.navsub = domNode}>
        <summary className="c-nav__sub-button" onClick = {(event)=>{
          this.props.onSubmenuChanged( !this.navsub.open)
          event.preventDefault()
        }}>
          {this.props.name}
        </summary>
        <div className="c-nav__sub-items">
          <button className="c-nav__sub-items-button" aria-label="return to menu" onClick = {()=> { this.props.onSubmenuChanged(false) }}>Main Menu</button>
          {this.props.children}
        </div>
      </details>
    )
  }
}

module.exports = NavSubComp;
