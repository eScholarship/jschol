// ##### Issue Actions Component ##### //

// Within c-itemactions parent <div>, between 2 - 5 buttons or similar components can be used, as in example below.

// Styles that extend .o-button button object styles (like for applying custom button icons) should be placed in _itemactions.scss, as with the c-itemactions__button-[name] examples below:

import React from 'react'
import ShareComp from '../components/ShareComp.jsx'
import NotYetLink from '../components/NotYetLink.jsx'

class IssueActionsComp_preJoel extends React.Component {
  render() {
    let p = this.props
    return (
      <div className="c-itemactions">
        <NotYetLink element="button" className="c-itemactions__button-print">Buy Issue</NotYetLink>
        <div className="o-download">
          <NotYetLink element="button" className="o-button__8">Download Issue</NotYetLink>
        </div>
        <ShareComp type="uc" id={this.props.unit_id} />
      </div>
    )
  }
}

module.exports = IssueActionsComp_preJoel;
