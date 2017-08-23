// ##### Tab Metrics Component ##### //

import React from 'react'

class TabMetricsComp extends React.Component {
  componentWillMount() {
    if (!(typeof document === "undefined")) {
      const script = document.createElement("script")
      script.src = "https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js"
      script.async = true
      document.body.appendChild(script)
    }
  }

  render() {
    return (
      <div className="c-tabcontent">
        <h1 className="c-tabcontent__main-heading" tabIndex="-1">Metrics</h1>
        <div className="c-well">
          <br/>
          Beta Note: Metrics data below are demonstration samples.
          <br/><br/>
        </div>
        <div className="c-tabcontent__divide2x">
          <div className="c-tabcontent__divide2x-child">
            <table className="c-datatable">
              <caption>Total Usage</caption>
              <thead>
                <tr>
                  <th scope="col">Actions</th>
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
            <h2 className="o-heading3">By Month</h2>
            <div className="c-itemactions">
              <div className="o-input__droplist2">
                <label htmlFor="o-input__droplist-label2">From:</label>
                <select name="" id="o-input__droplist-label2">
                  <option value="">January, 2017</option>
                  <option value="">February, 2017</option>
                  <option value="">March, 2017</option>
                </select>
              </div>
              <div className="o-input__droplist2">
                <label htmlFor="o-input__droplist-label2">To:</label>
                <select name="" id="o-input__droplist-label2">
                  <option value="">January, 2017</option>
                  <option value="">February, 2017</option>
                  <option value="">March, 2017</option>
                </select>
              </div>
            </div>
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
          <div className="c-tabcontent__divide2x-child">
            <div className='altmetric-embed' data-badge-type='donut' data-badge-details='right' data-doi="10.1038/nature.2012.9872"></div>
          </div>
        </div>
      </div>
    )
  }
}

module.exports = TabMetricsComp;
