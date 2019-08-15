// ##### Unit List Component ##### //

import React from 'react'

class UnitListComp extends React.Component {
  render() {
    return (
      <div className="c-unitlist">
        <h3>{this.props.heading}</h3>
        <ul>
          <li>
            <a href="">Language Ideologies and Hegemonic Factors Imposed upon Judeo-Spanish Speaking Communities</a>
          </li>
          <li>
            <a href="">From the New Heights: The City and Migrating Latinas in Real Women Have Curves and María Full of Grace</a>
          </li>
          <li>
            <a href="">Coupled Cardiac Electrophysiology and Contraction using Finite Element</a>
          </li>
        </ul>
      </div>
    )
  }
}

export default UnitListComp;
