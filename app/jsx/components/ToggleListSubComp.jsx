// ##### Toggle List Sub Component ##### //

import React from 'react'

class ToggleListSubComp extends React.Component {
  constructor(props){
    super(props)
    this.state = {open: false, date: new Date()}
  }
  render() {
    return (
      <details className="c-togglelist__sublist" ref={dom => this.details = dom} open={this.props.override.date > this.state.date ? this.props.override.open : this.state.open}>
        <summary onClick={event => {
          this.setState({open: !this.details.open, date: new Date()})
          event.preventDefault()
        }}>{this.props.title}</summary>
        <ul>
          {this.props.children}
        </ul>
      </details>
    )
  }
}

module.exports = ToggleListSubComp;
