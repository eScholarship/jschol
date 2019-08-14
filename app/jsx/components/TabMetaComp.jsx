// ##### Tab Meta Component ##### //

import React from 'react'
import _ from 'lodash'

class TabMetaComp extends React.Component {

  displayObject (k,v,i) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      return (
        <tr key={k+v}>
          <th scope="row">{k}</th>
          <td>{String(v)}</td>
        </tr>
      )
    } else {
      if (_.isEmpty(v)) {
        return (
          <tr key={k+i}>
            <th scope="row">{k}</th>
            <td>null</td>
          </tr>
        )
      } else {
        return (
          <tr key={k+i}>
            <th scope="row">{k}</th>
            <td><pre>{JSON.stringify(v, null, 2)}</pre></td>
          </tr>
        )
      }
    }
  }

  noUnit () {
    return <tr><th scope="row">None</th><td>No unit associated with this item</td></tr>
  }

  render() {
    let p = this.props
    let item_properties = Object.keys(p).map( (k, i) => {
      if ((_.isFunction(p[k])) || (k == 'attrs') || (k == 'unit') || (k == 'unit_attrs') || (k == 'citation') || (k == 'currentTab') || (k == 'header') || (k == 'sidebar') || (k == 'usage')) {
        // Things that aren't relevant (or are being included in the other properties used below)
      } else {
        return this.displayObject(k, p[k], i)
      }
    })
    let itemattr_properties = Object.keys(p.attrs).map( (k, i) => {
      return this.displayObject(k, p.attrs[k], i)
    })
    let unitattr_properties = p.unit_attrs ? Object.keys(p.unit_attrs).map( (k, i) => {
      return this.displayObject(k, p.unit_attrs[k], i)
    }) : this.noUnit()
    let unit_properties = p.unit ? <tbody>
      <tr>
        <th scope="row">unit</th><td><pre>{JSON.stringify(p.unit, null, 2)}</pre></td>
      </tr>
      <tr>
        <th scope="row">ancestorID</th><td>{p.header.ancestorID}</td>
      </tr>
      <tr>
        <th scope="row">ancestorName</th><td>{p.header.ancestorName}</td>
      </tr>
      <tr>
        <th scope="row">campusID</th><td>{p.header.campusID}</td>
      </tr>
      <tr>
        <th scope="row">campusName</th><td>{p.header.campusName}</td>
      </tr>
      <tr>
        <th scope="row">directSubmit</th><td>{p.header.directSubmit}</td>
      </tr>
      <tr>
        <th scope="row">directSubmitURL</th><td>{p.header.directSubmitURL}</td>
      </tr>
    </tbody> : this.noUnit()
    return (
      <div className="c-tabcontent">
        <h1 className="c-tabcontent__main-heading" tabIndex="-1">Metadata for item <strong>{p.id}</strong>  ({"React.js version " + React.version})</h1>
        <div className="c-datatable c-datatable-leftalign">
          <table>
            <thead>
              <tr><th scope="col">Item Props</th><th scope="col">Description</th></tr>
            </thead>
            <tbody>{item_properties}</tbody>
          </table>
          <table>
            <thead>
              <tr><th scope="col">Item Attrs</th><th scope="col">Description</th></tr>
            </thead>
            <tbody>{itemattr_properties}</tbody>
          </table>
          <table>
            <thead>
              <tr><th scope="col">Unit Props</th><th scope="col">Description</th></tr>
            </thead>
                   {unit_properties}
          </table>
          <table>
            <thead>
              <tr><th scope="col">Unit Attrs</th><th scope="col">Description</th></tr>
            </thead>
            <tbody>{unitattr_properties}</tbody>
          </table>
        </div>
      </div>
    )
  }
}

export default TabMetaComp;
