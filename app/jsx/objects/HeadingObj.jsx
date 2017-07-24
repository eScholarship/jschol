// ##### Heading Objects ##### //

// Heading element numbers (<h1>, <h2>, <h3>, etc.) need to be organized logically in the DOM, per accessibility requirements. Therefore, the 'o-heading' className numbers below may not match the heading element numbers, per design requirements. for example, <h3 className="o-heading2"> would be fine.

import React from 'react'

class HeadingObj extends React.Component {
  render() {
    return (
      <div>

        <h2>Heading Style 1</h2>
        <h4 className="o-heading1">From the New Heights: The City and Migrating Latinas in Real Women Have Curves and María Full of Grace</h4>

        <h2>Heading Style 2</h2>
        <h1 className="o-heading2">From the New Heights: The City and Migrating Latinas in Real Women Have Curves and María Full of Grace</h1>

        <h2>Heading Style 3</h2>
        <h3 className="o-heading3">From the New Heights: The City and Migrating Latinas in Real Women Have Curves and María Full of Grace</h3>

        <h2>Heading Style 3a</h2>
        <h3 className="o-heading3a">From the New Heights: The City and Migrating Latinas in Real Women Have Curves and María Full of Grace</h3>

        <h2>Heading Style 4</h2>
        <h3 className="o-heading4">From the New Heights: The City and Migrating Latinas in Real Women Have Curves and María Full of Grace</h3>

      </div>
    )
  }
}

module.exports = HeadingObj;
