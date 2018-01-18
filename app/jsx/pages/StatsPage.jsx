
import React from 'react'
import { Link } from 'react-router'
import _ from 'lodash'

import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import MetaTagsComp from '../components/MetaTagsComp.jsx'
import PageBase from './PageBase.jsx'

export default class StatsPage extends PageBase
{
  pageDataURL() {
    const pm = this.props.params
    return `/api/unit/${pm.unitID}/stats/${pm.pageName || "summary"}`
  }

  needHeaderFooter() { return false } //  disable standard header and footer

  renderData(data) {
    return(
      <div>
        <MetaTagsComp title="Stats"/>
        <h1>Historical data by item</h1>
        <div className="c-datatable">
          <table>
            <thead>
              <tr>
                <th scope="col" key="id">ID</th>
                <th scope="col" key="item">Item</th>
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
                    <a href={`/uc/item/${item}`}>{item.replace(/^qt/, '')}</a>
                  </th>
                  <th key="item">
                    <ArbitraryHTMLComp html={md.title} h1Level={2}/>
                  </th>
                  {data.report_months.length > 1 &&
                    <td key="total">{md.total_hits}</td>}
                  {data.report_months.map(ym =>
                    <td key={ym}>{parseInt(md.by_month[ym])}</td>
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
