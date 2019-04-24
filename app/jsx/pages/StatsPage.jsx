
import React from 'react'
import { Link } from 'react-router-dom'
import _ from 'lodash'
import FormComp from '../components/FormComp.jsx'

import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import MetaTagsComp from '../components/MetaTagsComp.jsx'
import PageBase from './PageBase.jsx'

const ymToString = ym =>
  ym.toString().substr(0,4) + "-" + ym.toString().substr(4,2)

const formatNum = n =>
  n && n.toLocaleString()

const describeChildren = childTypes => {
  let out = []
  _.each(childTypes, (count, type) =>
    out.push(count.toString() + " " + type + (count==1 || type.endsWith("ies") ? "" : type.endsWith("s") ? "es" : "s")))
  return out.join(", ")
}

const statsLink = (unit, pageName, search) =>
  `/uc/${unit}/stats${pageName ? "/"+pageName : ""}${search}`

const capitalize = str =>
  str.charAt(0).toUpperCase() + str.slice(1)

const mungeCategory = cat =>
  cat.indexOf("postprints:") >= 0 ? "\xa0\xa0\xa0\xa0"+capitalize(cat.replace("postprints:", "")) :
  cat == "unknown" ? cat :
  capitalize(cat)

const downloadCSV = (table, params) =>
{
  // Since we've got the data in a table already, just re-format it as CSV.
  let rows = []
  _.each(table.children, tsect => {
    _.each(tsect.children, tr => {
      let rd = []
      _.each(tr.children, td => {
        let val = td.children[0] ? td.children[0].innerHTML : td.innerHTML
        val = val.replace(/<!--[^>]+-->/g, '').replace(/%$/, '').replace(/&nbsp;/g, ' ')
        if (/^[0-9,]+$/.test(val))
          rd.push(parseInt(val.replace(/,/g, '')))
        else if (/^[0-9,.]+$/.test(val))
          rd.push(parseFloat(val.replace(/,/g, '')))
        else
          rd.push('"' + val.toString().replace('"', "'") + '"')
      })
      rows.push(rd.join(","))
    })
  })
  require.ensure(['downloadjs'], function(require) {
    let filename
    if (params.unitID)
      filename = params.unitID.replace(/^root$/, 'eschol') + "_" + params.pageName + ".csv"
    else
      filename = "author_" + params.pageName + ".csv"
    require('downloadjs')(rows.join("\n"), filename, "text/csv")
  }, 'downloadjs')
}

class StatsHeader extends React.Component {
  render() {
    let p = this.props
    let pageName = p.match.params.pageName || "summary"
    let isIssuePage = pageName.indexOf("issue") >= 0
    let isByMonthPage = pageName.indexOf("by_month") >= 0
    let thisLink = p.match.params.unitID ? `/uc/${p.match.params.unitID}/stats` : `/uc/author/${p.match.params.personID}/stats`
    let thisLabel = p.match.params.unitID ? p.data.unit_name : p.data.author_name
    return(
      <div>
        <MetaTagsComp title={`${p.title}: ${p.data.unit_name || p.data.author_name}`}/>
        <h1>
          { pageName == "summary" ? thisLabel : <Link to={thisLink}>{thisLabel}</Link> }
        </h1>
        { p.data.parent_id && !isIssuePage &&
          <p>
            Parent: <Link to={statsLink(p.data.parent_id, p.match.params.pageName, p.location.search)}>
                      {p.data.parent_name}
                    </Link>
          </p>
        }
        <h2>eScholarship stats: {p.title}{isByMonthPage ? "" : ` for ${p.data.date_str}`}</h2>
      </div>
    )
  }
}

class StatsFooter extends React.Component {
  render = () =>
    <div>
      {this.props.onDownload &&
        <div className="c-statsReport-bottomButtons">
          <button className="o-button__8" onClick={this.props.onDownload}>Download CSV</button>
          <div className="c-toplink">
            <a href="javascript:window.scrollTo(0, 0)">Top</a>
          </div>
        </div>
      }
      <div className="c-statsReport-disclaimer">
        <hr/>
        Disclaimer: due to the evolving nature of the web traffic we receive and the methods we use to collate it,
        the data presented here should be considered approximate and subject to revision.
      </div>
    </div>
}

class StatsForm extends React.Component
{
  componentWillMount() { this.setState({customDates: this.props.data.range == "custom"}) }
  componentWillReceiveProps(nextProps) { this.setState({customDates: nextProps.data.range == "custom"}) }

  onChangeRange = e =>
    this.setState({customDates: e.target.value == "custom"})

  render() {
    let p = this.props
    return (
      <FormComp to={p.location.pathname} method="GET">
        <div className="c-daterange">
          <div className="o-input__inline">
            <div key="range" className="o-input__droplist1">
              <label htmlFor="range">Date range</label>
              <select id="range" name="range" defaultValue={p.data.range} onChange={this.onChangeRange}>
                <option value="1mo">Last month</option>
                <option value="4mo">Last 4 months</option>
                <option value="12mo">Last 12 months</option>
                <option value="5yr">Last 5 years</option>
                <option value="all">All time</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {this.state.customDates &&
              [
                <div key="st_yr" className="o-input__droplist1">
                  <label htmlFor="st_yr">Start year</label>
                  <select id="st_yr" name="st_yr" defaultValue={p.data.st_yr}>
                    {p.data.all_years.map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                </div>,
                <div key="st_mo" className="o-input__droplist1">
                  <label htmlFor="st_mo">Start month</label>
                  <select id="st_mo" name="st_mo" defaultValue={p.data.st_mo}>
                    {_.range(1,13).map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                </div>,
                <div key="en_yr" className="o-input__droplist1">
                  <label htmlFor="en_yr">End year</label>
                  <select id="en_yr" name="en_yr" defaultValue={p.data.en_yr}>
                    {p.data.all_years.map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                </div>,
                <div key="en_mo" className="o-input__droplist1">
                  <label htmlFor="en_mo">End month</label>
                  <select id="en_mo" name="en_mo" defaultValue={p.data.en_mo}>
                    {_.range(1,13).map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
                </div>
              ]
            }
            {p.showLimit &&
              <div key="limit" className="o-input__droplist1">
                <label htmlFor="limit">Max items:</label>
                <select id="limit" name="limit" defaultValue={p.data.limit}>
                  <option key={50} value={50}>50</option>
                  <option key={100} value={100}>100</option>
                  <option key={200} value={200}>200</option>
                  <option key={500} value={500}>500</option>
                </select>
              </div>
            }
          </div>
          <button type="submit" key="submit">Update</button>
        </div>
      </FormComp>
    )
  }
}

class UnitStats_Summary extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <StatsHeader title="Summary" {...this.props}/>
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
                <td>{formatNum(data.posts)}</td>
                <td>{formatNum(data.hits)}</td>
                <td>{formatNum(data.downloads)}</td>
                <td>{formatNum(data.hits - data.downloads)}</td>
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
                  <td key={rd[0]}>{formatNum(rd[1])}</td>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Available Reports</h2>
        <ul className="c-reportList">
          <li>
            History by:
            {data.unit_type == "journal" &&
              <Link to={`/uc/${this.props.match.params.unitID}/stats/history_by_issue`}>Issue</Link>}
            <Link to={`/uc/${this.props.match.params.unitID}/stats/history_by_item`}>Item</Link>
            {data.has_children &&
              <Link to={`/uc/${this.props.match.params.unitID}/stats/history_by_unit`}>Unit</Link> }
            <Link to={`/uc/${this.props.match.params.unitID}/stats/referrals`}>Referrer</Link>
          </li>
          <li>
            Breakdown by:
            <Link to={`/uc/${this.props.match.params.unitID}/stats/breakdown_by_month`}>Month</Link>
            {data.unit_type == "journal" &&
              <Link to={`/uc/${this.props.match.params.unitID}/stats/breakdown_by_issue`}>Issue</Link>}
            <Link to={`/uc/${this.props.match.params.unitID}/stats/breakdown_by_item`}>Item</Link>
            {data.has_children &&
              <Link to={`/uc/${this.props.match.params.unitID}/stats/breakdown_by_unit`}>Unit</Link> }
            {data.num_categories > 1 &&
              <Link to={`/uc/${this.props.match.params.unitID}/stats/breakdown_by_category`}>Category</Link>}
          </li>
          {(data.num_categories > 1 || data.has_children) &&
            <li>
              Deposits by:
              {data.has_children &&
                <Link to={`/uc/${this.props.match.params.unitID}/stats/deposits_by_unit`}>Unit</Link>}
              {data.num_categories > 1 &&
                <Link to={`/uc/${this.props.match.params.unitID}/stats/deposits_by_category`}>Category</Link>}
            </li>
          }
          {(data.num_categories > 1 || data.has_children) &&
            <li>
              Average requests per item by:
              {data.has_children &&
                <Link to={`/uc/${this.props.match.params.unitID}/stats/avg_by_unit`}>Unit</Link>}
              {data.num_categories > 1 &&
                <Link to={`/uc/${this.props.match.params.unitID}/stats/avg_by_category`}>Category</Link>}
            </li>
          }
          {/* NOT YET:
           this.props.match.params.unitID == "root" &&
            <li>
              Other:
              <Link to={`/uc/${this.props.match.params.unitID}/stats/deposits_by_oa`}>Deposits by OA</Link>
            </li>
          */}
        </ul>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class EitherStats_HistoryByItem extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <StatsHeader title="History by Item" {...this.props}/>
        <StatsForm location={this.props.location} data={data} showLimit={true}/>
        <div className="c-datatable">
          <table ref={el => this.table=el}>
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
                    <td key="total">{formatNum(md.total_hits)}</td>}
                  {data.report_months.map(ym =>
                    <td key={ym}>{md.by_month[ym] > 0 ? formatNum(md.by_month[ym]) : null}</td>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class UnitStats_HistoryByIssue extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <StatsHeader title="History by Issue" {...this.props}/>
        <StatsForm location={this.props.location} data={data}/>
        <div className="c-datatable">
          <table ref={el => this.table=el}>
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
                      <Link to={`/uc/${this.props.match.params.unitID}/${md.vol_num}/${md.iss_num}`}>{issue}</Link>
                    </th>
                    {data.report_months.length > 1 &&
                      <td key="total">{formatNum(md.total_hits)}</td>}
                    {data.report_months.map(ym =>
                      <td key={ym}>{md.by_month[ym] > 0 ? formatNum(md.by_month[ym]) : null}</td>
                    )}
                  </tr>
                )}
              )}
            </tbody>
          </table>
        </div>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class UnitStats_Referrals extends React.Component {
  render() {
    let data = this.props.data
    let months = data.report_months
    let fmonths = months.filter(val => val != 201711) // we have no referral data for this month (see note below)
    return(
      <div className="c-statsReport">
        <StatsHeader title="History by Referrer" {...this.props}/>
        <StatsForm location={this.props.location} data={data}/>

        <div className="c-datatable">
          <table ref={el => this.table=el}>
            <thead>
              <tr>
                <th scope="col" key="ref">Referrer</th>
                {fmonths.length > 1 &&
                  <th scope="col" key="total">Total referrals</th>}
                {fmonths.map(ym =>
                  <th scope="col" key={ym}>{ymToString(ym)}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, md =>
                <tr key={md.referrer}>
                  <th scope="row" key="id">{md.referrer}</th>
                  {fmonths.length > 1 &&
                    <td key="total">{formatNum(md.total_referrals)}</td>}
                  {fmonths.map(ym =>
                    <td key={ym}>{md.by_month[ym] > 0 ? formatNum(md.by_month[ym]) : null}</td>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Let the user know there was a gap in referral data */}
        {(months.indexOf(201710) >= 0 || months.indexOf(201711) >= 0 || months.indexOf(201712) >= 0) &&
          <p>Note: Referral data was not collected from Oct 19 to Dec 4, 2017.</p>}
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class EitherStats_BreakdownByItem extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <StatsHeader title="Breakdown by Item" {...this.props}/>
        <StatsForm location={this.props.location} data={data} showLimit={true}/>
        <div className="c-datatable">
          <table ref={el => this.table=el}>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col" className="c-statsReport-title">Title</th>
                <th scope="col">Total requests</th>
                <th scope="col">Download</th>
                <th scope="col">View-only</th>
                <th scope="col">%Dnld</th>
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
                  <td>{formatNum(md.total_hits)}</td>
                  <td>{formatNum(md.total_downloads)}</td>
                  <td>{md.total_hits > 0 && formatNum(md.total_hits - md.total_downloads)}</td>
                  <td>{md.total_hits > 0 && ((md.total_downloads * 100.0 / md.total_hits).toFixed(1)+"%")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class UnitStats_BreakdownByIssue extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <StatsHeader title="Breakdown by Issue" {...this.props}/>
        <StatsForm location={this.props.location} data={data}/>
        <div className="c-datatable">
          <table ref={el => this.table=el}>
            <thead>
              <tr>
                <th scope="col">Vol/Iss</th>
                <th scope="col">Total requests</th>
                <th scope="col">Download</th>
                <th scope="col">View-only</th>
                <th scope="col">%Dnld</th>
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, issueData => {
                let issue = issueData[0]
                let md = issueData[1]
                return(
                  <tr key={issue}>
                    <th scope="row">
                      <Link to={`/uc/${this.props.match.params.unitID}/${md.vol_num}/${md.iss_num}`}>{issue}</Link>
                    </th>
                    <td>{formatNum(md.total_hits)}</td>
                    <td>{formatNum(md.total_downloads)}</td>
                    <td>{md.total_hits > 0 && formatNum(md.total_hits - md.total_downloads)}</td>
                    <td>{md.total_hits > 0 && ((md.total_downloads * 100.0 / md.total_hits).toFixed(1)+"%")}</td>
                  </tr>
                )}
              )}
            </tbody>
          </table>
        </div>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class EitherStats_BreakdownByMonth extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <StatsHeader title={`Breakdown by Month`} {...this.props}/>
        <div className="c-datatable">
          <table ref={el => this.table=el}>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Deposits</th>
                <th scope="col">Total requests</th>
                <th scope="col">Download</th>
                <th scope="col">View-only</th>
                <th scope="col">%Dnld</th>
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, md =>
                <tr key={md[0]}>
                  <th scope="row">{ymToString(md[0])}</th>
                  <td>{formatNum(md[1])}</td>
                  <td>{formatNum(md[2])}</td>
                  <td>{formatNum(md[3])}</td>
                  <td>{md[2] > 0 && formatNum(md[2] - md[3])}</td>
                  <td>{md[2] > 0 && ((md[3] * 100.0 / md[2]).toFixed(1)+"%")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class UnitStats_BreakdownByCategory extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <StatsHeader title="Breakdown by Category" {...this.props}/>
        <StatsForm location={this.props.location} data={data}/>
        <div className="c-datatable">
          <table ref={el => this.table=el}>
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Deposits</th>
                <th scope="col">Total requests</th>
                <th scope="col">Download</th>
                <th scope="col">View-only</th>
                <th scope="col">%Dnld</th>
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, cd =>
                <tr key={cd.category}>
                  <th scope="row">{mungeCategory(cd.category)}</th>
                  <td>{formatNum(cd.total_deposits)}</td>
                  <td>{formatNum(cd.total_requests)}</td>
                  <td>{formatNum(cd.total_downloads)}</td>
                  <td>{cd.total_requests > 0 && formatNum(cd.total_requests - cd.total_downloads)}</td>
                  <td>{cd.total_requests > 0 && ((cd.total_downloads * 100.0 / cd.total_requests).toFixed(1)+"%")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class UnitStats_DepositsByCategory extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <StatsHeader title="Deposits by Category" {...this.props}/>
        <StatsForm location={this.props.location} data={data}/>
        <div className="c-datatable">
          <table ref={el => this.table=el}>
            <thead>
              <tr>
                <th scope="col" key="id">Category</th>
                {data.report_months.length > 1 &&
                  <th scope="col" key="total">Total deposits</th>}
                {data.report_months.map(ym =>
                  <th scope="col" key={ym}>{ymToString(ym)}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, cd =>
                <tr key={cd.category}>
                  <th scope="row" key="id">{mungeCategory(cd.category)}</th>
                  {data.report_months.length > 1 &&
                    <td key="total">{formatNum(cd.total_deposits)}</td>}
                  {data.report_months.map(ym =>
                    <td key={ym}>{formatNum(cd.by_month[ym] > 0 ? cd.by_month[ym] : null)}</td>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class UnitStats_DepositsByOA extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <StatsHeader title="Deposits by OA policy relation" {...this.props}/>
        <StatsForm location={this.props.location} data={data}/>
        <div className="c-datatable">
          <table ref={el => this.table=el}>
            <thead>
              <tr>
                <th scope="col" key="id">Category</th>
                {data.report_months.length > 1 &&
                  <th scope="col" key="total">Total deposits</th>}
                {data.report_months.map(ym =>
                  <th scope="col" key={ym}>{ymToString(ym)}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, cd =>
                <tr key={cd.category}>
                  <th scope="row" key="id">{mungeCategory(cd.category)}</th>
                  {data.report_months.length > 1 &&
                    <td key="total">{formatNum(cd.total_deposits)}</td>}
                  {data.report_months.map(ym =>
                    <td key={ym}>{formatNum(cd.by_month[ym] > 0 ? cd.by_month[ym] : null)}</td>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class UnitStats_DepositsByUnit extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <StatsHeader title="Deposits by Unit" {...this.props}/>
        <StatsForm location={this.props.location} data={data}/>
        <div className="c-datatable">
          <table ref={el => this.table=el}>
            <thead>
              <tr>
                <th scope="col" key="id">Unit</th>
                {data.any_drill_down &&
                  <th scope="col" key="dd">Drill down</th>}
                {data.report_months.length > 1 &&
                  <th scope="col" key="total">Total deposits</th>}
                {data.report_months.map(ym =>
                  <th scope="col" key={ym}>{ymToString(ym)}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, cd =>
                <tr key={cd.unit_name}>
                  <th scope="row" key="id">
                    {cd.unit_name != "Overall" ?
                      <Link to={`/uc/${cd.unit_id}/stats`}>{cd.unit_name}</Link> :
                      cd.unit_name }
                  </th>
                  {data.any_drill_down &&
                    <td key="dd">
                      {cd.child_types &&
                        <Link to={`/uc/${cd.unit_id}/stats/deposits_by_unit${this.props.location.search}`}>
                          {describeChildren(cd.child_types)}
                        </Link>}
                    </td>
                  }
                  {data.report_months.length > 1 &&
                    <td key="total">{formatNum(cd.total_deposits)}</td>}
                  {data.report_months.map(ym =>
                    <td key={ym}>{formatNum(cd.by_month[ym] > 0 ? cd.by_month[ym] : null)}</td>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class UnitStats_HistoryByUnit extends React.Component {
  render() {
    let p = this.props
    return(
      <div className="c-statsReport">
        <StatsHeader title="History by Unit" {...p}/>
        <StatsForm {...p}/>
        <div className="c-datatable">
          <table ref={el => this.table=el}>
            <thead>
              <tr>
                <th scope="col" key="id">Unit</th>
                {p.data.any_drill_down &&
                  <th scope="col" key="dd">Drill down</th>}
                {p.data.report_months.length > 1 &&
                  <th scope="col" key="total">Total requests</th>}
                {p.data.report_months.map(ym =>
                  <th scope="col" key={ym}>{ymToString(ym)}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {_.map(p.data.report_data, cd =>
                <tr key={cd.unit_name}>
                  <th scope="row" key="id">
                    {cd.unit_name != "Overall" ?
                      <Link to={`/uc/${cd.unit_id}/stats`}>{cd.unit_name}</Link> :
                      cd.unit_name }
                  </th>
                  {p.data.any_drill_down &&
                    <td key="dd">
                      {cd.child_types &&
                        <Link to={statsLink(cd.unit_id, p.match.params.pageName, p.location.search)}>
                          {describeChildren(cd.child_types)}
                        </Link>}
                    </td>
                  }
                  {p.data.report_months.length > 1 &&
                    <td key="total">{formatNum(cd.total_requests)}</td>}
                  {p.data.report_months.map(ym =>
                    <td key={ym}>{formatNum(cd.by_month[ym] > 0 ? cd.by_month[ym] : null)}</td>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class UnitStats_AvgByUnit extends React.Component {
  render() {
    let p = this.props
    return(
      <div className="c-statsReport">
        <StatsHeader title="Average Requests per Item by Unit" {...p}/>
        <StatsForm {...p}/>
        <div className="c-datatable">
          <table ref={el => this.table=el}>
            <thead>
              <tr>
                <th scope="col" key="id">Unit</th>
                {p.data.any_drill_down &&
                  <th scope="col" key="dd">Drill down</th>}
                {p.data.report_months.length > 1 &&
                  <th scope="col" key="total">Avg req/item</th>}
                {p.data.report_months.map(ym =>
                  <th scope="col" key={ym}>{ymToString(ym)}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {_.map(p.data.report_data, cd =>
                <tr key={cd.unit_name}>
                  <th scope="row" key="id">
                    {cd.unit_name != "Overall" ?
                      <Link to={`/uc/${cd.unit_id}/stats`}>{cd.unit_name}</Link> :
                      cd.unit_name }
                  </th>
                  {p.data.any_drill_down &&
                    <td key="dd">
                      {cd.child_types &&
                        <Link to={statsLink(cd.unit_id, p.match.params.pageName, p.location.search)}>
                          {describeChildren(cd.child_types)}
                        </Link>}
                    </td>
                  }
                  {p.data.report_months.length > 1 &&
                    <td key="total">{formatNum(cd.total_avg)}</td>}
                  {p.data.report_months.map(ym =>
                    <td key={ym}>{formatNum(cd.by_month[ym] > 0 ? cd.by_month[ym] : null)}</td>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class UnitStats_AvgByCategory extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <StatsHeader title="Average Requests per Item by Category" {...this.props}/>
        <StatsForm location={this.props.location} data={data}/>
        <div className="c-datatable">
          <table ref={el => this.table=el}>
            <thead>
              <tr>
                <th scope="col" key="id">Category</th>
                {data.report_months.length > 1 &&
                  <th scope="col" key="total">Avg req/item</th>}
                {data.report_months.map(ym =>
                  <th scope="col" key={ym}>{ymToString(ym)}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, cd =>
                <tr key={cd.category}>
                  <th scope="row" key="id">{mungeCategory(cd.category)}</th>
                  {data.report_months.length > 1 &&
                    <td key="total">{cd.total_avg}</td>}
                  {data.report_months.map(ym =>
                    <td key={ym}>{cd.by_month[ym] > 0 ? cd.by_month[ym] : null}</td>
                  )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class UnitStats_BreakdownByUnit extends React.Component {
  render() {
    let p = this.props
    return(
      <div className="c-statsReport">
        <StatsHeader title="Breakdown by Unit" {...p}/>
        <StatsForm {...p}/>
        <div className="c-datatable">
          <table ref={el => this.table=el}>
            <thead>
              <tr>
                <th scope="col">Unit</th>
                {p.data.any_drill_down &&
                  <th scope="col">Drill down</th>}
                <th scope="col">Deposits</th>
                <th scope="col">Total requests</th>
                <th scope="col">Download</th>
                <th scope="col">View-only</th>
                <th scope="col">%Dnld</th>
              </tr>
            </thead>
            <tbody>
              {_.map(p.data.report_data, cd =>
                <tr key={cd.unit_name}>
                  <th scope="row" key="id">
                    {cd.unit_name != "Overall" ?
                      <Link to={`/uc/${cd.unit_id}/stats`}>{cd.unit_name}</Link> :
                      cd.unit_name }
                  </th>
                  {p.data.any_drill_down &&
                    <th key="dd">
                      {cd.child_types &&
                        <Link to={statsLink(cd.unit_id, p.match.params.pageName, p.location.search)}>
                          {describeChildren(cd.child_types)}
                        </Link>
                      }
                    </th>
                  }
                  <td>{formatNum(cd.total_deposits)}</td>
                  <td>{formatNum(cd.total_requests)}</td>
                  <td>{formatNum(cd.total_downloads)}</td>
                  <td>{cd.total_requests > 0 && formatNum(cd.total_requests - cd.total_downloads)}</td>
                  <td>{cd.total_requests > 0 && ((cd.total_downloads * 100.0 / cd.total_requests).toFixed(1)+"%")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <StatsFooter onDownload={e=>downloadCSV(this.table, this.props.match.params)}/>
      </div>
    )
  }
}

class AuthorStats_Summary extends React.Component {
  render() {
    let data = this.props.data
    return(
      <div className="c-statsReport">
        <StatsHeader title="Summary" {...this.props}/>
        { data.variations.length > 1 &&
          <p>(* see below for name/email variations)</p>
        }
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
                <td>{formatNum(data.posts)}</td>
                <td>{formatNum(data.hits)}</td>
                <td>{formatNum(data.downloads)}</td>
                <td>{formatNum(data.hits - data.downloads)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Available Reports</h2>
        <ul className="c-reportList">
          <li>
            History by:
            <Link to={`/uc/author/${this.props.match.params.personID}/stats/history_by_item`}>Item</Link>
          </li>
          <li>
            Breakdown by:
            <Link to={`/uc/author/${this.props.match.params.personID}/stats/breakdown_by_item`}>Item</Link>
            <Link to={`/uc/author/${this.props.match.params.personID}/stats/breakdown_by_month`}>Month</Link>
          </li>
        </ul>
        { data.variations.length > 1 &&
          <div>
            * Author name/email variations included in these reports:
            <ul>
              { _.map(data.variations, nv =>
                <li key={nv[0]+nv[1]}>{nv[0]} &lt;{nv[1]}&gt;</li>
              )}
            </ul>
          </div>
        }
        <StatsFooter/>
      </div>
    )
  }
}

export class UnitStatsPage extends PageBase
{
  needHeaderFooter() { return false } //  disable standard header and footer

  renderContent() {
    // Error case
    if (this.state.pageData && this.state.pageData.error)
      return this.renderError()

    // Normal case -- a little different from PageBase in that we also render as loading when fetching data.
    return (this.state.pageData && !this.state.fetchingData) ? this.renderData(this.state.pageData) : this.renderLoading()
  }

  renderData(data) {
    const pageName = this.props.match.params.pageName || "summary"
    if (pageName == "summary")
      return <UnitStats_Summary data={data} {...this.props}/>
    else if (pageName == "history_by_item")
      return <EitherStats_HistoryByItem data={data} {...this.props}/>
    else if (pageName == "history_by_issue")
      return <UnitStats_HistoryByIssue data={data} {...this.props}/>
    else if (pageName == "breakdown_by_item")
      return <EitherStats_BreakdownByItem data={data} {...this.props}/>
    else if (pageName == "breakdown_by_issue")
      return <UnitStats_BreakdownByIssue data={data} {...this.props}/>
    else if (pageName == "breakdown_by_month")
      return <EitherStats_BreakdownByMonth data={data} {...this.props}/>
    else if (pageName == "referrals")
      return <UnitStats_Referrals data={data} {...this.props}/>
    else if (pageName == "deposits_by_category")
      return <UnitStats_DepositsByCategory data={data} {...this.props}/>
    else if (pageName == "deposits_by_unit")
      return <UnitStats_DepositsByUnit data={data} {...this.props}/>
    else if (pageName == "history_by_unit")
      return <UnitStats_HistoryByUnit data={data} {...this.props}/>
    else if (pageName == "breakdown_by_unit")
      return <UnitStats_BreakdownByUnit data={data} {...this.props}/>
    else if (pageName == "breakdown_by_category")
      return <UnitStats_BreakdownByCategory data={data} {...this.props}/>
    else if (pageName == "avg_by_unit")
      return <UnitStats_AvgByUnit data={data} {...this.props}/>
    else if (pageName == "avg_by_category")
      return <UnitStats_AvgByCategory data={data} {...this.props}/>
    else if (pageName == "KMBCCiwUg0mTS8f")
      return <UnitStats_DepositsByOA data={data} {...this.props}/>
  }
}

export class AuthorStatsPage extends PageBase
{
  needHeaderFooter() { return false } //  disable standard header and footer

  renderContent() {
    // Error case
    if (this.state.pageData && this.state.pageData.error)
      return this.renderError()

    // Normal case -- a little different from PageBase in that we also render as loading when fetching data.
    return (this.state.pageData && !this.state.fetchingData) ? this.renderData(this.state.pageData) : this.renderLoading()
  }

  renderData(data) {
    const pageName = this.props.match.params.pageName || "summary"
    if (pageName == "summary")
      return <AuthorStats_Summary data={data} {...this.props}/>
    else if (pageName == "history_by_item")
      return <EitherStats_HistoryByItem data={data} {...this.props}/>
    else if (pageName == "breakdown_by_item")
      return <EitherStats_BreakdownByItem data={data} {...this.props}/>
    else if (pageName == "breakdown_by_month")
      return <EitherStats_BreakdownByMonth data={data} {...this.props}/>
  }
}
