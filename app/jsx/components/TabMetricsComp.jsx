// ##### Tab Metrics Component ##### //

import React from 'react'

class TabMetricsComp extends React.Component {
  render() {
    return (
      <div className="c-tabcontent">
        <h1 className="c-tabcontent__heading" tabIndex="-1">Metrics content to go here</h1> 
        <div className="o-dividecontent2x">
          <h2>Total Usage</h2>
          <table className="c-datatable">
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col">Total</th>
                <th scope="col">Monthly Average</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Hits</th>
                <td>Odio</td>
                <td>Lorem</td>
              </tr>
              <tr>
                <th scope="row">Downloads</th>
                <td>Iusto</td>
                <td>Architecto</td>
              </tr>
            </tbody>
          </table>
          <h2>By Month</h2>
          <table className="c-datatable">
            <thead>
              <tr>
                <th scope="col">Monthly</th>
                <th scope="col">Hits</th>
                <th scope="col">Downloads</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">2016-03</th>
                <td>1,268</td>
                <td>271</td>
              </tr>
              <tr>
                <th scope="row">2016-02</th>
                <td>1,269</td>
                <td>250</td>
              </tr>
              <tr>
                <th scope="row">2016-01</th>
                <td>1,110</td>
                <td>233</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

module.exports = TabMetricsComp;
