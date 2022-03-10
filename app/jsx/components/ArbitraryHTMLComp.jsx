import React from 'react'
import { MathJax } from "better-react-mathjax"
import Utils from '../utils.jsx'
import PropTypes from 'prop-types'

/**
 * Adds arbitrary HTML to the page (usually supplied earlier by the user and stored in the database).
 * Re-maps <h1>, <h2> etc in the HTML to the specified level to improve accessibility.
 * Option to wrap HTML with surrounding <p> if needed
 */
export default class ArbitraryHTMLComp extends React.Component
{
  static propTypes = {
    html: PropTypes.string,
    h1Level: PropTypes.number, // defaults to 3
    p_wrap: PropTypes.bool
  }

  // Attach script necessary for opening Deposit Wizard from any links defined as: http://open-deposit-wizard.com
  componentWillMount() {
    if (!(typeof document === "undefined")) {
      const s = document.createElement("script")
      s.async = true
      s.innerHTML = "function openDepositWiz(event) {event.preventDefault(); document.getElementById(\'wizardlyDeposit\').click();}";
      document.body.appendChild(s)
    }
  }

  render() {
    let origText = this.props.html
    if (origText) {
      let h1Level = this.props.h1Level ? this.props.h1Level : 3
      let minLevel = 9
      origText.replace(/(<\/?[hH])([1-9]+)/g,
                        (m, p1, p2) => minLevel = Math.min(minLevel, parseInt(p2)))
      let fixedText = origText.replace(/(<\/?[hH])([1-9]+)/g,
                        (m, p1, p2) => p1 + (parseInt(p2) + h1Level - minLevel))
      // Kludge for opening deposit wizard modal
      let fixedText2 = fixedText.replace(/<a href=\"http:\/\/open-deposit-wizard\.com\">/g,
        '<a href="" onClick="openDepositWiz(event);">')
      this.props.p_wrap && (fixedText2 = Utils.p_wrap(fixedText2))
      if (!(typeof document === "undefined") && /\$[^0-9/\.]/.test(fixedText2)) { // heuristic to detect MathJax: $ followed by non-digit, only runs in a browser, not ISO
        return (
          <MathJax>
            <div className="c-clientmarkup" dangerouslySetInnerHTML={{__html: fixedText2}}/>
          </MathJax>
        )
      }
      else {
        return (
          <div className="c-clientmarkup" dangerouslySetInnerHTML={{__html: fixedText2}}/>
        )
      }
    } else { return null }
  }
}
