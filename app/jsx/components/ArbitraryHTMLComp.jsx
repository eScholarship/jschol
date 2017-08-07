import React from 'react'
import PropTypes from 'prop-types'

/**
 * Adds arbitrary HTML to the page (usually supplied earlier by the user and stored in the database).
 * Re-maps <h1>, <h2> etc in the HTML to the specified level to improve accessibility.
 */
export default class ArbitraryHTMLComp extends React.Component
{
  static propTypes = {
    html: PropTypes.string.isRequired,
    h1Level: PropTypes.number.isRequired
  }

  render() {
    let origText = this.props.html
    let fixedText = origText.replace(/(<\/?[hH])([1-9]+)/g, 
                      (m, p1, p2) => p1 + (parseInt(p2) + this.props.h1Level - 1))
    return <div dangerouslySetInnerHTML={{__html: fixedText}}/>
  }
}
