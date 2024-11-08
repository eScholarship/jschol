// ##### Rights Component ##### //

import React from 'react'
import LazyImageComp from '../components/LazyImageComp.jsx'
import PropTypes from 'prop-types'
import MEDIA_PATH from '../../js/MediaPath.js'

class RightsComp extends React.Component {
  static propTypes = {
    rights: PropTypes.string,
    size: PropTypes.oneOf(['small', 'large']),
    classname: PropTypes.string
  }

  render() {
    if (this.props.rights.includes("publicdomain"))
    {
      let r = this.props.rights,
        size = this.props.size,
        m = r.match(/^https:\/\/creativecommons.org\/publicdomain\/zero\/(\d\.\d)\/$/),
        kind = "zero",
        ver = m[1]
      return (
      <a href={r} className={this.props.classname ? this.props.classname : "c-publocation__license"}>
        <LazyImageComp src={MEDIA_PATH+`cc-${kind}-${size}.svg`} alt={`Creative Commons CC0 public domain dedication, version ${ver}.`} />
      </a>
      )
    }
    else
    {
      let r = this.props.rights,
        size = this.props.size,
        m = r.match(/^https:\/\/creativecommons.org\/licenses\/(by|by-nc|by-nc-nd|by-nc-sa|by-nd|by-sa)\/(\d\.\d)\/$/),
        kind = m[1],
        ver = m[2]
      return (
      <a href={r} className={this.props.classname ? this.props.classname : "c-publocation__license"}>
        <LazyImageComp src={MEDIA_PATH+`cc-${kind}-${size}.svg`} alt={`Creative Commons '${kind.toUpperCase()}' version ${ver} license`} />
      </a>
      )
    }	  

  }
}

export default RightsComp;
