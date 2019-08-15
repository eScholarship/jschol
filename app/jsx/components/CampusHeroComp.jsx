// ##### Campus Hero Component ##### //

import React from 'react'
import { Link } from 'react-router-dom'

class CampusHeroComp extends React.Component {
  render() {
    let heroImage = this.props.hero && this.props.hero.url ?
        "url(" + this.props.hero.url + ")"
      : null 
    return (
      <div className="c-campushero" style={{backgroundImage: heroImage}}>
        <div className="c-campushero__lede">
          Share your research <span>with a global audience</span>
        </div>
        <div className="c-campushero__text">
          The eScholarship suite of open access publishing services gives UC scholars direct control over the creation and dissemination of the full range of their research.
        </div>
        <div className="c-campushero__link">
          <Link to={"/uc/"+this.props.campusID+"/about"}>Get started</Link>
        </div>
      </div>
    )
  }
}

export default CampusHeroComp;
