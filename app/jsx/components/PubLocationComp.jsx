// ##### Published Location Component ##### //

import React from 'react'

class PubLocationComp extends React.Component {
  render() {
    let pub_loc_block = null
    if (this.props.pub_web_loc.length > 0) {
      pub_loc_block = 
        this.props.pub_web_loc.map(function(url, i) {
          return ( <a key={i} className="c-publocation__link" href={url}>{url}</a> )
        })
    }
    return (
      <div className="c-publocation">
        {pub_loc_block &&
          <div className="c-publocation__heading">
            <h2>Published Web Location</h2>
          </div>
        }
        {pub_loc_block}
        {this.props.rights && this.getRights(this.props.rights)}
      </div>
    )
  }

  getRights = r => {
    let baseURL = "https://creativecommons.org",
      lv = "4.0",
      rightsMap = {
        'public':      [`${baseURL}/publicdomain/zero/1.0/`,   "cc-zero-large.svg",     "CC0 1.0 Universal (Public Domain)"],
        'CC BY':       [`${baseURL}/licenses/by/${lv}/`,       "cc-by-large.svg",       "Attribution 4.0 International Public License"],
        'CC BY-NC':    [`${baseURL}/licenses/by-nc/${lv}/`,    "cc-by-nc-large.svg",    "Attribution-NonCommercial 4.0 International Public License"],
        'CC BY-NC-ND': [`${baseURL}/licenses/by-nc-nd/${lv}/`, "cc-by-nc-nd-large.svg", "Attribution-NonCommercial-NoDerivatives 4.0 International Public License"],
        'CC BY-NC-SA': [`${baseURL}/licenses/by-nc-sa/${lv}/`, "cc-by-nc-sa-large.svg", "Attribution-NonCommercial-ShareAlike 4.0 International Public License"],
        'CC BY-ND':    [`${baseURL}/licenses/by-nd/${lv}/`,    "cc-by-nd-large.svg",    "Attribution-NoDerivatives 4.0 International Public License"],
        'CC BY-SA':    [`${baseURL}/licenses/by-sa/${lv}/`,    "cc-by-sa-large.svg",    "Attribution-ShareAlike 4.0 International Public License"] },
      a = rightsMap[r],
      altText = "Creative Commons "
    return (
      <a href={a[0]} className="c-publocation__license">
        <img src={"/images/"+a[1]} alt={altText + a[2]} />
      </a>
    )
  }
}

module.exports = PubLocationComp;
