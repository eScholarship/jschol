// ##### Issue Actions Component ##### //

// Within c-itemactions parent <div>, between 2 - 5 buttons or similar components can be used, as in example below.

// Styles that extend .o-button button object styles (like for applying custom button icons) should be placed in _itemactions.scss, as with the c-itemactions__button-[name] examples below:

import React from 'react'
import ShareComp from '../components/ShareComp.jsx'
import NotYetLink from '../components/NotYetLink.jsx'

class IssueActionsComp extends React.Component {
  render() {
    let p = this.props
    return (
      <div className="c-itemactions">
        { p.buy_link && <a className="c-itemactions__button-buy" href={p.buy_link}>Buy Issue</a> }
        <div className="o-download">
        {/* ToDo: Change class of this button to "o-download__button" when details are filled in */}
          <NotYetLink element="button" className="o-button__8">Download Issue</NotYetLink>
        </div>
        <ShareComp type="unit" id={this.props.unit_id} />
      </div>
    )
  }
}

module.exports = IssueActionsComp;
