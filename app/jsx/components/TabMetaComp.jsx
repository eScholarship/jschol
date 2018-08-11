// ##### Tab Meta Component ##### //

import React from 'react'

class TabMetaComp extends React.Component {
  getInitialState () {
    console.log("initial")	
  }
  componentWillMount(nextProps) {
    console.log("Mounting")
  }
  render() {
  	console.log("Rendering")
    return (
      <div className="c-tabcontent">
        <h1 className="c-tabcontent__main-heading" tabIndex="-1">Meta Info</h1>
      </div>
    )
  }
}

module.exports = TabMetaComp;
