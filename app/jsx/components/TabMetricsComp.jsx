// ##### Tab Metrics Component ##### //

import React from 'react'
import PropTypes from 'prop-types'

class TotalUsage extends React.Component {

  getTotal = (rows, v) => {
    if (rows.length == 0) return 0
    return rows.reduce(function (a, b) {
      return b[v] == null ? a : (a + b[v])
    }, 0)
  }


  render() {
    let hitsTotal = this.getTotal(this.props.usage, "hits"),
        hitsTotal_str = hitsTotal.toLocaleString(),
        hitsAvg = this.props.usage.length > 0 ? Math.round(hitsTotal / this.props.usage.length).toLocaleString() : 0,
        downloadsTotal = this.getTotal(this.props.usage, "downloads"),
        downloadsTotal_str = downloadsTotal.toLocaleString(),
        downloadsAvg = this.props.usage.length > 0 ? Math.round(downloadsTotal / this.props.usage.length).toLocaleString() : 0
    return (
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
            <td>{hitsTotal_str}</td>
            <td>{hitsAvg}</td>
          </tr>
          <tr>
            <th scope="row">Downloads</th>
            <td>{downloadsTotal_str}</td>
            <td>{downloadsAvg}</td>
          </tr>
        </tbody>
      </table>
    )
  }
}

class MonthlyUsage extends React.Component {
  getMonth = (rows, i) => {
    let len = rows.length
    if (len == 0) return ''
    if (i > len) i = len
    let recent12 = (len < 12) ? rows : rows.slice(-12)
    return recent12[i-1].month
  }

  // Using method above, set default selectors to most recent 12 months
  state = { from: this.getMonth(this.props.usage, 1),
            to: this.getMonth(this.props.usage, 12) }

  changeFrom = e => {
    this.setState({from: e.target.value})
  }

  changeTo = e => {
    this.setState({to: e.target.value})
  }

  render() {
    let months_all = this.props.usage.map( r => { return r.month }),
        selector = months_all.map( (m, i) => {
          return <option key={i} value={m}>{m}</option>
        }),
        selectedUsage = this.props.usage.map( (r, i) => {
          if ((r.month >= this.state.from) && (r.month <= this.state.to)) { 
            return (
              <tr key={i}>
                <th scope="row">{r.month}</th>
                <td>{r.hits.toLocaleString()}</td>
                <td>{r.downloads.toLocaleString()}</td>
              </tr>
            )
          }
        })
    return (
      <div>
        <h2 className="o-heading3">By Month</h2>
        <div className="c-itemactions">
          <div className="o-input__droplist2">
            <label htmlFor="o-input__droplist-label2">From:</label>
            <select name="" id="o-input__droplist-label2" onChange={this.changeFrom} value={this.state.from}>
              {selector}
            </select>
          </div>
          <div className="o-input__droplist2">
            <label htmlFor="o-input__droplist-label2">To:</label>
            <select name="" id="o-input__droplist-label2" onChange={this.changeTo} value={this.state.to}>
              {selector}
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
            {selectedUsage}
          </tbody>
        </table>
      </div>
    )
  }
}

class TabMetricsComp extends React.Component {
  static propTypes = {
    usage: PropTypes.arrayOf(PropTypes.shape({
      month: PropTypes.string,
      hits: PropTypes.number,
      downloads: PropTypes.number
    })).isRequired
  }

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
        {this.props.usage.length > 0 ?
          <div className="c-tabcontent__divide2x-child">
            <TotalUsage usage={this.props.usage} />
            <MonthlyUsage usage={this.props.usage} />
          </div>
        :
          <div className="c-tabcontent__divide2x-child">
            <div className="c-well">
              No usage data currently found for this item.
            </div>
          </div>
        }
          <div className="c-tabcontent__divide2x-child">
            <div className='altmetric-embed' data-badge-type='donut' data-badge-details='right' data-doi="10.1038/nature.2012.9872"></div>
          </div>
        </div>
      </div>
    )
  }
}

module.exports = TabMetricsComp;
