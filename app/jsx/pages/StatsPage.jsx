
import React from 'react'
import { Link } from 'react-router'
import _ from 'lodash'
import Form from 'react-router-form'

import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import MetaTagsComp from '../components/MetaTagsComp.jsx'
import PageBase from './PageBase.jsx'

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
    return(
      <div>
        <MetaTagsComp title="Stats"/>
        <h1>Historical data by item</h1>
        <Form to={this.props.location.pathname} method="GET">
          <label htmlFor="st_yr"> Start year: </label>
          <select id="st_yr" name="st_yr" defaultValue={data.start_year}>
            {data.year_range.map(yr =>
              <option key={yr} value={yr}>{yr}</option>
            )}
          </select>

          <label htmlFor="st_mo"> month: </label>
          <select id="st_mo" name="st_mo" defaultValue={data.start_month}>
            {_.range(1,13).map(mo =>
              <option key={mo} value={mo}>{mo}</option>
            )}
          </select>

          &#160;&#160;

          <label htmlFor="en_yr"> End year: </label>
          <select id="en_yr" name="en_yr" defaultValue={data.end_year}>
            {data.year_range.map(yr =>
              <option key={yr} value={yr}>{yr}</option>
            )}
          </select>

          <label htmlFor="en_mo"> month: </label>
          <select id="en_mo" name="en_mo" defaultValue={data.end_month}>
            {_.range(1,13).map(mo =>
              <option key={mo} value={mo}>{mo}</option>
            )}
          </select>

          &#160;&#160;

          <label htmlFor="limit"> Max items: </label>
          <select id="limit" name="limit" defaultValue={data.limit}>
            <option key={50} value={50}>50</option>
            <option key={100} value={100}>100</option>
            <option key={200} value={200}>200</option>
            <option key={500} value={500}>500</option>
          </select>

          &#160;&#160;

          <button type="submit">Update</button>

          <br/><br/>
        </Form>
        <div className="c-datatable">
          <table>
            <thead>
              <tr>
                <th scope="col" key="id">ID</th>
                <th scope="col" key="item" className="c-statsReport-title">Item</th>
                {data.report_months.length > 1 &&
                  <th scope="col" key="total">Total requests</th>}
                {data.report_months.map(ym =>
                  <th scope="col" key={ym}>{ym.toString().substr(0,4)}-{ym.toString().substr(4,2)}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {_.map(data.report_data, (md, item) =>
                <tr key={item}>
                  <th scope="row" key="id">
                    <Link to={`/uc/item/${item.replace(/^qt/, '')}`}>{item.replace(/^qt/, '')}</Link>
                  </th>
                  <th key="item" className="c-statsReport-title">
                    <ArbitraryHTMLComp html={md.title} h1Level={2}/>
                  </th>
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
