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
        { p.buy_link && <a className="c-itemactions__link-buy" href={p.buy_link}>Buy Issue</a> }
        <div className="o-download">
        {/* ToDo: */}
          <NotYetLink element="a" className="o-download__button">Download Issue</NotYetLink>
        </div>
        <ShareComp type="unit" id={this.props.unit_id} />
      </div>
    )
  }
}

module.exports = IssueActionsComp;
