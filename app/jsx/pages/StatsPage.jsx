
import React from 'react'
import { Link } from 'react-router'
import _ from 'lodash'
import Form from 'react-router-form'

import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import MetaTagsComp from '../components/MetaTagsComp.jsx'
import PageBase from './PageBase.jsx'

const ymToString = ym =>
  ym.toString().substr(0,4) + "-" + ym.toString().substr(4,2)

class StatsForm extends React.Component {
  render = () =>
    <Form to={this.props.location.pathname} method="GET">
      {this.props.names.map(name =>
        (name == "st_yr" || name == "st_mo" || name == "en_yr" || name == "en_mo") ?
          <span key={name}>
            <label htmlFor="st_yr">{name.replace("st_", "Start ").
                                         replace("en_", "End ").
                                         replace("yr", "year").
                                         replace("mo", "month")}</label>
            <select id={name} name={name} defaultValue={this.props.data[name]}>
              {((name == "st_yr" || name == "en_yr") ? this.props.data.year_range : _.range(1,13)).map(val =>
                <option key={val} value={val}>{val}</option>
              )}
            </select>
          </span> :
        (name == "limit") ?
          <span key={name}>
            <label htmlFor="limit">Max items:</label>
            <select id="limit" name="limit" defaultValue={this.props.data.limit}>
              <option key={50} value={50}>50</option>
              <option key={100} value={100}>100</option>
              <option key={200} value={200}>200</option>
              <option key={500} value={500}>500</option>
            </select>
          </span>
        : null
      )}
      <button type="submit" key="submit">Update</button>
    </Form>
}

class UnitStats_Summary extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <MetaTagsComp title={`Summary: ${data.unit_name}`}/>
        <h1>{data.unit_name}</h1>
        <h2>Summary for {data.dateStr}</h2>
        <div className="c-datatable">
          <table>
            <thead>
              <tr>
                <th scope="col">Deposits</th>
                <th scope="col">Total requests</th>
                <th scope="col">Download</th>
                <th scope="col">View-only</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{data.posts}</td>
                <td>{data.hits}</td>
                <td>{data.downloads}</td>
                <td>{data.hits - data.downloads}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Top Referrers</h2>
        <div className="c-datatable">
          <table>
            <thead>
              <tr>
                {_.map(data.referrals, rd =>
                  <th scope="col" key={rd[0]}>{rd[0]}</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                {_.map(data.referrals, rd =>
                  <td key={rd[0]}>{rd[1]}</td>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Available Reports</h2>
        <ul>
          <li><Link to={`/uc/${this.props.params.unitID}/stats/breakdown_by_month`}>Breakdown by Month</Link></li>
          {data.unit_type == "journal" &&
            <li><Link to={`/uc/${this.props.params.unitID}/stats/breakdown_by_issue`}>Breakdown by Issue</Link></li>}
          {data.unit_type == "journal" &&
            <li><Link to={`/uc/${this.props.params.unitID}/stats/history_by_issue`}>History by Issue</Link></li>}
          <li><Link to={`/uc/${this.props.params.unitID}/stats/breakdown_by_item`}>Breakdown by Item</Link></li>
          <li><Link to={`/uc/${this.props.params.unitID}/stats/history_by_item`}>History by Item</Link></li>
        </ul>
      </div>
    )
  }
}

class UnitStats_HistoryByItem extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <MetaTagsComp title={`Stats: History by Item: ${data.unit_name}`}/>
        <h1><Link to={`/uc/${this.props.params.unitID}/stats`}>{data.unit_name}</Link></h1>
        <h2>Stats: Historical Data by Item</h2>
        <StatsForm location={this.props.location} data={data} names={["st_yr", "st_mo", "en_yr", "en_mo", "limit"]}/>
        <div className="c-datatable">
          <table>
            <thead>
              <tr>
                <th scope="col" key="id">Item</th>
                <th scope="col" key="item" className="c-statsReport-title">Title</th>
                {data.report_months.length > 1 &&
                  <th scope="col" key="total">Total requests</th>}
                {data.report_months.map(ym =>
                  <th scope="col" key={ym}>{ymToString(ym)}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, (md, item) =>
                <tr key={item}>
                  <th scope="row" key="id" className="c-statsReport-id">
                    <Link to={`/uc/item/${item.replace(/^qt/, '')}`}>{item.replace(/^qt/, '')}</Link>
                  </th>
                  <td key="item" className="c-statsReport-title">
                    <ArbitraryHTMLComp html={md.title} h1Level={2}/>
                  </td>
                  {data.report_months.length > 1 &&
                    <td key="total">{md.total_hits}</td>}
                  {data.report_months.map(ym =>
                    <td key={ym}>{md.by_month[ym] > 0 ? md.by_month[ym] : null}</td>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

class UnitStats_HistoryByIssue extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <MetaTagsComp title={`Stats: History by Issue: ${data.unit_name}`}/>
        <h1><Link to={`/uc/${this.props.params.unitID}/stats`}>{data.unit_name}</Link></h1>
        <h2>Stats: Historical Data by Issue</h2>
        <StatsForm location={this.props.location} data={data} names={["st_yr", "st_mo", "en_yr", "en_mo"]}/>
        <div className="c-datatable">
          <table>
            <thead>
              <tr>
                <th scope="col" key="id">Vol/Iss</th>
                {data.report_months.length > 1 &&
                  <th scope="col" key="total">Total requests</th>}
                {data.report_months.map(ym =>
                  <th scope="col" key={ym}>{ymToString(ym)}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, issueData => {
                let issue = issueData[0]
                let md = issueData[1]
                return(
                  <tr key={issue}>
                    <th scope="row" key="id">
                      <Link to={`/uc/${this.props.params.unitID}/${md.vol_num}/${md.iss_num}`}>{issue}</Link>
                    </th>
                    {data.report_months.length > 1 &&
                      <td key="total">{md.total_hits}</td>}
                    {data.report_months.map(ym =>
                      <td key={ym}>{md.by_month[ym] > 0 ? md.by_month[ym] : null}</td>
                    )}
                  </tr>
                )}
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

class UnitStats_BreakdownByItem extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <MetaTagsComp title={`Stats: Breakdown by Item: ${data.unit_name}`}/>
        <h1><Link to={`/uc/${this.props.params.unitID}/stats`}>{data.unit_name}</Link></h1>
        <h2>Stats: Breakdown by Item</h2>
        <StatsForm location={this.props.location} data={data} names={["st_yr", "st_mo", "en_yr", "en_mo", "limit"]}/>
        <div className="c-datatable">
          <table>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col" className="c-statsReport-title">Title</th>
                <th scope="col">Total requests</th>
                <th scope="col">Download</th>
                <th scope="col">View-only</th>
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, (md, item) =>
                <tr key={item}>
                  <th scope="row" className="c-statsReport-id">
                    <Link to={`/uc/item/${item.replace(/^qt/, '')}`}>{item.replace(/^qt/, '')}</Link>
                  </th>
                  <th className="c-statsReport-title">
                    <ArbitraryHTMLComp html={md.title} h1Level={2}/>
                  </th>
                  <td>{md.total_hits}</td>
                  <td>{md.total_downloads}</td>
                  <td>{md.total_hits - md.total_downloads}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

class UnitStats_BreakdownByIssue extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <MetaTagsComp title={`Stats: Breakdown by Issue: ${data.unit_name}`}/>
        <h1><Link to={`/uc/${this.props.params.unitID}/stats`}>{data.unit_name}</Link></h1>
        <h2>Stats: Breakdown by Issue</h2>
        <StatsForm location={this.props.location} data={data} names={["st_yr", "st_mo", "en_yr", "en_mo"]}/>
        <div className="c-datatable">
          <table>
            <thead>
              <tr>
                <th scope="col">Vol/Iss</th>
                <th scope="col">Total requests</th>
                <th scope="col">Download</th>
                <th scope="col">View-only</th>
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, issueData => {
                let issue = issueData[0]
                let md = issueData[1]
                return(
                  <tr key={issue}>
                    <th scope="row">
                      <Link to={`/uc/${this.props.params.unitID}/${md.vol_num}/${md.iss_num}`}>{issue}</Link>
                    </th>
                    <td>{md.total_hits}</td>
                    <td>{md.total_downloads}</td>
                    <td>{md.total_hits - md.total_downloads}</td>
                  </tr>
                )}
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

class UnitStats_BreakdownByMonth extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <MetaTagsComp title={`Stats: Breakdown by Month: ${data.unit_name}`}/>
        <h1><Link to={`/uc/${this.props.params.unitID}/stats`}>{data.unit_name}</Link></h1>
        <h2>Stats: Breakdown by Month</h2>
        <div className="c-datatable">
          <table>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Deposits</th>
                <th scope="col">Total requests</th>
                <th scope="col">Download</th>
                <th scope="col">View-only</th>
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, md =>
                <tr key={md[0]}>
                  <td>{ymToString(md[0])}</td>
                  <td>{md[1]}</td>
                  <td>{md[2]}</td>
                  <td>{md[3]}</td>
                  <td>{md[2] - md[3]}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

export default class StatsPage extends PageBase
{
  pageDataURL() {
    const pm = this.props.params
    return `/api/unit/${pm.unitID}/stats/${pm.pageName || "summary"}${this.props.location.search}`
  }

  needHeaderFooter() { return false } //  disable standard header and footer

  renderContent() {
    // Error case
    if (this.state.pageData && this.state.pageData.error)
      return this.renderError()

    // Normal case -- a little different from PageBase in that we also render as loading when fetching data.
    return (this.state.pageData && !this.state.fetchingData) ? this.renderData(this.state.pageData) : this.renderLoading()
  }

  renderData(data) {
    const pageName = this.props.params.pageName || "summary"
    if (pageName == "summary")
      return <UnitStats_Summary data={data} {...this.props}/>
    else if (pageName == "history_by_item")
      return <UnitStats_HistoryByItem data={data} {...this.props}/>
    else if (pageName == "history_by_issue")
      return <UnitStats_HistoryByIssue data={data} {...this.props}/>
    else if (pageName == "breakdown_by_item")
      return <UnitStats_BreakdownByItem data={data} {...this.props}/>
    else if (pageName == "breakdown_by_issue")
      return <UnitStats_BreakdownByIssue data={data} {...this.props}/>
    else if (pageName == "breakdown_by_month")
      return <UnitStats_BreakdownByMonth data={data} {...this.props}/>
  }
}
