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
    // if(event.preventDefault) event.preventDefault(); else event.returnValue = false;
    let fixedText2 = fixedText.replace(`<a href=\"http:\/\/open-deposit-wizard.com\">`, 
      `<a href=\"\" onClick=\"javascript:$('wizardlyDeposit').click()\">`)
    console.log(fixedText)
    return <div dangerouslySetInnerHTML={{__html: fixedText2}}/>
  }
}
