// ##### Toggle List Sub Component ##### //

import React from 'react'
import { Link } from 'react-router'

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
        }} aria-label="list of sub items"></summary>
        <ul>
        { this.props.children.map((node) =>
            node.children ?
              <li key={node.id}>
                <Link to={"/uc/" + node.id}>
                  {node.name}</Link>
                <ToggleListSubComp override={this.props.override}>{node.children}</ToggleListSubComp></li>
             :
              <li key={node.id}>
                <Link to={"/uc/" + node.id}>
                  {node.name}</Link></li> )
        }
        </ul>
      </details>
    )
  }
}

module.exports = ToggleListSubComp;
