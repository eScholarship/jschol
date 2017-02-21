// ##### Published Location Component ##### //

import React from 'react'

class PublishedLocationComp extends React.Component {
  render() {
    let pub_loc_block = null
    if (this.props.pub_web_loc.length > 0) {
      pub_loc_block = 
        <div className="c-publishedlocation__location">
          <div className="o-textlink__secondary">Published Web Location</div>
          <div>
            {this.props.pub_web_loc.map(function(url, i) {
              return ( <span key={i}><a href={url}>{url}</a></span> )
            })}
          </div>
        </div>
    } else {
      pub_loc_block = <div className="c-publishedlocation__location">&nbsp;</div>
    }
    return (
      <div className="c-publishedlocation">
        {pub_loc_block}
        {this.props.rights && this.getRights(this.props.rights)}
      </div>
    )
  }

  getRights = r => {
    let baseURL = "https://creativecommons.org",
      lv = "4.0",
      rightsMap = {
        'public':      [`${baseURL}/publicdomain/zero/1.0/`,   "icon_cc-zero.svg",     "Public Domain"],
        'CC BY':       [`${baseURL}/licenses/by/${lv}/`,       "icon_cc-by.svg",       "Attribution"],
        'CC BY-NC':    [`${baseURL}/licenses/by-nc/${lv}/`,    "icon_cc-by-nc.svg",    "Attribution Non-Commercial"],
        'CC BY-NC-ND': [`${baseURL}/licenses/by-nc-nd/${lv}/`, "icon_cc-by-nc-nd.svg", "Attribution Non-Commercial No Derivatives"],
        'CC BY-NC-SA': [`${baseURL}/licenses/by-nc-sa/${lv}/`, "icon_cc-by-nc-sa.svg", "Attribution Non-Commercial Share Alike"],
        'CC BY-ND':    [`${baseURL}/licenses/by-nd/${lv}/`,    "icon_cc-by-nd.svg",    "Attribution No Derivatives"],
        'CC BY-SA':    [`${baseURL}/licenses/by-sa/${lv}/`,    "icon_cc-by-sa.svg",    "Attribution Share Alike"] },
      a = rightsMap[r],
      altText = "Rights Status: "
    return (
      <a href={a[0]} className="c-publishedlocation__license">
        <img src={"/images/"+a[1]} alt={altText + a[2]} />
      </a>
    )
  }
}

module.exports = PublishedLocationComp;
