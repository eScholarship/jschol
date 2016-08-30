
import React from 'react'
import { Link } from 'react-router'
//import PDFJS from 'pdfjs-dist'
import $ from 'jquery'

class ItemPage extends React.Component 
{
  constructor(props) {
    super(props)
  }

  render() {
    let s = this.state
    return(
      <div>
        <h2>Item viewer</h2>
        <Viewer />
      </div>
    )
  }
}

class Viewer extends React.Component
{
  render() { return(
    <div id="outerContainer">
      Outer container
    </div>
  )}
}


module.exports = ItemPage;
