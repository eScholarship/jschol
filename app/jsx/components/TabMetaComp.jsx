// ##### Tab Meta Component ##### //

import React from 'react'
import _ from 'lodash'

class TabMetaComp extends React.Component {
  render() {
    let p = this.props
    let unit_properties = [
      <tr key="900">
        <th scope="row">unit</th>
        <td><pre>{JSON.stringify(p.unit, null, 2)}</pre></td>
      </tr>,
      <tr key="901">
        <th scope="row">ancestorID</th>
        <td>{p.header.ancestorID}</td>
      </tr>,
      <tr key="902">
        <th scope="row">ancestorName</th>
        <td>{p.header.ancestorName}</td>
      </tr>,
      <tr key="903">
        <th scope="row">campusID</th>
        <td>{p.header.campusID}</td>
      </tr>,
      <tr key="904">
        <th scope="row">campusName</th>
        <td>{p.header.campusName}</td>
      </tr>,
      <tr key="905">
        <th scope="row">directSubmit</th>
        <td>{p.header.directSubmit}</td>
      </tr>,
      <tr key="906">
        <th scope="row">directSubmitURL</th>
        <td>{p.header.directSubmitURL}</td>
      </tr>
    ]
    let item_properties = Object.keys(p).map( (k, i) => {
      let v = p[k]
      if ((_.isFunction(v)) || (k == 'currentTab') || (k == 'header') || (k == 'sidebar') || (k == 'unit') || (k == 'usage')) {
        // Things that aren't relevant (or are being included in unit_properties above)
      } else if (typeof v === 'string') {
        return (
          <tr key={k+v}>
            <th scope="row">{k}</th>
            <td>{v}</td>
          </tr>
        )
      } else {
        if (_.isEmpty(v)) {
          return (
            <tr key={i}>
              <th scope="row">{k}</th>
              <td>null</td>
            </tr>
          )
        } else {
          return (
            <tr key={i}>
              <th scope="row">{k}</th>
              <td><pre>{JSON.stringify(v, null, 2)}</pre></td>
            </tr>
          )
        }
      }
    })
    return (
      <div className="c-tabcontent">
        <h1 className="c-tabcontent__main-heading" tabIndex="-1">Metadata for item <strong>{p.id}</strong>  ({"React version " + React.version})</h1>
        <div className="c-datatable c-datatable-leftalign">
          <table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Description</th>
              </tr>
            </thead>
            <tbody>
              {unit_properties}
              {item_properties}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

module.exports = TabMetaComp;
