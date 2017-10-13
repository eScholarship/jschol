// ##### Campus Heading and Menu Component ##### //

import React from 'react'
import { Link } from 'react-router'
import { DropdownMenu, MenuContent } from '../components/DropdownMenu.jsx'

class CampusSelectorComp extends React.Component {
  campusSelector(campuses) {
    return campuses.map( c => {
      return c['id'] != "" && <li key={c['id']}><Link to={"/uc/"+ c['id']}>{c['name']}</Link></li>
    })
  }

  render() {
    let p = this.props
    return (
      <div className="o-customselector--campus">
        <div className="o-customselector__heading">
          <Link to={"/uc/" + p.campusID}>{p.campusName ? p.campusName : "eScholarship"}</Link>
        </div>
        <DropdownMenu detailsClass="o-customselector__selector" ariaLabel="select campus">
          <MenuContent> <div className="o-customselector__menu">
            <div className="o-customselector__sub-heading" id="c-campusselector__sub-heading">eScholarship at &hellip;</div>
            <ul className="o-customselector__items" aria-labelledby="c-campusselector__sub-heading" role="list">
              {this.campusSelector(p.campuses)}
            </ul>
          </div> </MenuContent>
        </DropdownMenu>
      </div>
    )
  }
}

module.exports = CampusSelectorComp;
