// ##### Published Location Component ##### //

import React from 'react'

class PublishedLocationComp extends React.Component {
  render() {
    return (
      <div className="c-publishedlocation">
        <div className="c-publishedlocation__location">
          <a className="o-textlink__secondary" href="">Published Web Location</a>
          {(this.props.loc.length > 0)
             ? <div>
                 {this.props.loc.map(function(url, i) {
                   return ( <span key={i}><a href={url}>{url}</a></span> )
                 })}
               </div>
             : <span>No data is associated with this publication.</span> }
        </div>
        {/* ToDo: Hook-up Rights */}
        <a href="" className="c-publishedlocation__license">
          <img src="/images/icon_cc-by-nc.svg" alt=""/>
        </a>
      </div>
    )
  }
}

module.exports = PublishedLocationComp;
