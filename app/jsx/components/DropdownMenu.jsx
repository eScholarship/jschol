import React from 'react'
import { Broadcast, Subscriber } from 'react-broadcast'

export default class DropdownMenu extends React.Component {
  state = { isOpen: false }

  componentDidMount() {
    this.mounted = true
  }

  componentWillUnmount() {
    this.mounted = false
  }

  onItemClicked = () => {
    this.anyFocused = false
    this.setState({ isOpen: false })
  }

  onFocus = () => {
    this.anyFocused = true
  }

  onBlur = () => {
    this.anyFocused = false
    // After the cascade of blur and focus events, if we end up with nothing in the menu
    // focused, close the menu.
    setTimeout(()=>{ if (!this.anyFocused && this.mounted) this.setState({ isOpen: false }) }, 0)
  }

  render = () =>
    <details className={this.props.detailsClass}
             open={this.state.isOpen ? "open" : ""}
             onFocus={this.onFocus} onBlur={this.onBlur}
             ref={(domNode)=> this.details = domNode}>
      <summary aria-label={this.props.ariaLabel}
               onFocus={this.onFocus}
               onBlur={this.onBlur}
               ref={(domNode)=> this.summary = domNode}
               onClick = {(event)=>{
                 setTimeout(()=>{
                   this.setState({isOpen: !this.details.open})
                   this.summary.focus() // Firefox fails to do this by default
                 }, 0)
                 event.preventDefault()
               }}>
        { this.props.summarySpan &&
          <span>{this.props.summarySpan}</span>
        }
      </summary>
      <div onClick={this.onItemClicked}>
        {this.props.children}
      </div>
    </details>
}
