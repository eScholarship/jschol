// ##### Tab Metrics Component ##### //
// Usage data represented by an array like this:
// [
//    {month: '2016-01', hits: 2000, downloads: 20},
//    {month: '2016-02', hits: 2762, downloads: 24},
//    {month: '2016-03', hits: 2221, downloads: 29} ... ]

import React from 'react'
import Utils from '../utils.jsx'
import PropTypes from 'prop-types'
import $ from 'jquery'

class TotalUsage extends React.Component {
  render() {
    let hitsTotal = Utils.sumValueTotals(this.props.usage, "hits"),
        hitsTotal_str = hitsTotal.toLocaleString(),
        hitsAvg = this.props.usage.length > 0 ? Math.round(hitsTotal / this.props.usage.length).toLocaleString() : 0,
        downloadsTotal = Utils.sumValueTotals(this.props.usage, "downloads"),
        downloadsTotal_str = downloadsTotal.toLocaleString(),
        downloadsAvg = this.props.usage.length > 0 ? Math.round(downloadsTotal / this.props.usage.length).toLocaleString() : 0
    return (
      <div className="c-datatable">
        <table>
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
      </div>
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
        monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        fullDate = ym => {
         let d = ym.split('-')
         let month = monthNames[parseInt(d[1]) - 1]
         return month + " " + d[0] 
        },
        selector = months_all.map( (m, i) => {
          return <option key={i} value={m}>{fullDate(m)}</option>
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
        <div className="c-datatable">
          <table>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Hits</th>
                <th scope="col">Downloads</th>
              </tr>
            </thead>
            <tbody>
              {selectedUsage}
            </tbody>
          </table>
        </div>
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
    })).isRequired,
    altmetrics_ok: PropTypes.bool,
    attrs: PropTypes.shape({
      doi: PropTypes.string,
      local_ids: PropTypes.array
    })
  }

  state = {altmetrics_nodata: false, dimensions_nodata: false }

  scripts = ["https://badge.dimensions.ai/badge.js",                  /* Dimensions widget https://badge.dimensions.ai/ */
             "https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js"  /* Altmetric widget  https://api.altmetric.com/embeds.html */ ]

  componentDidMount() {
    if (!(typeof document === "undefined")) {
      this.scripts.forEach(s => {
        const script = document.createElement("script")
        script.src = s
        script.async = true
        document.body.appendChild(script)
      })
      $('.altmetric-embed').on('altmetric:hide', () => {
        this.setState({altmetrics_nodata: true})
      })
      $('.__dimensions_badge_embed__').on('dimensions_embed:hide', () => {
        this.setState({dimensions_nodata: true})
      })
    }
  }

  componentWillUpdate() {
    if (window.__dimensions_embed) window.__dimensions_embed.addBadges()
  }

  render() {
    let pmid   // Dimensions can also be used with a PubMed ID
    if (this.props.attrs['local_ids']) {
      _.each(this.props.attrs['local_ids'], node => {
        if (node.type == "pmid" && pmid === undefined) pmid = node.id
      })
    }
    return (
      <div className="c-tabcontent">
        <h1 className="c-tabcontent__main-heading" tabIndex="-1">Metrics</h1>
      {!this.props.altmetrics_ok && (!this.props.usage || (this.props.usage && this.props.usage.length == 0)) ?
        <div className="o-well-colored">
          No usage data currently found for this item.
        </div>
      :
        <div className="c-tabcontent__divide2x">
        {this.props.usage && this.props.usage.length > 0 ?
          <div className="c-tabcontent__divide2x-child">
            <TotalUsage usage={this.props.usage} />
            <MonthlyUsage usage={this.props.usage} />

            <div className="o-well-colored">
	     Disclaimer: due to the evolving nature of the web traffic we receive and the methods we use to collate it, the data presented here should be considered approximate and subject to revision.
            </div>
          </div>
        :
          <div className="c-tabcontent__divide2x-child">
            <div className="o-well-colored">
              No usage data currently found for this item.
            </div>
          </div>
        }
          <div className="c-tabcontent__divide2x-child">
          {this.props.altmetrics_ok && (this.props.attrs.doi || pmid) &&
           [<h2 key="0" className="o-heading3">Online Attention</h2>,
            <p key="1">
              <span className="altmetric-embed" data-pmid={pmid} data-doi={this.props.attrs.doi} data-badge-type="donut" data-badge-details="right" data-hide-no-mentions="true"></span></p>,
            <div key="2" className={this.state.altmetrics_nodata ? "c-tabcontent-reveal" : "c-tabcontent-hide"}>AltMetric&reg; data is unavailable for this item.</div>,
            <p key="3"><br/></p>]
          }
          {(this.props.attrs.doi || pmid) &&
           [<h2 key="0" className="o-heading3">Citations</h2>,
            <p key="1">
              <span className="__dimensions_badge_embed__" data-pmid={pmid} data-doi={this.props.attrs.doi} data-hide-zero-citations="true" data-legend="always" data-style="small_circle"></span>

            </p>,
            <div key="2" className={this.state.dimensions_nodata ? "c-tabcontent-reveal" : "c-tabcontent-hide"}>Citation data is unavailable for this item.</div>]
          }
          </div>
        </div>
      }
      </div>
    )
  }
}

export default TabMetricsComp;
