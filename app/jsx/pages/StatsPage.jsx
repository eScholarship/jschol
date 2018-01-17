
import React from 'react'
import { Link } from 'react-router'

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
      <div className="c-stats">
        <MetaTagsComp title="Stats"/>
        <style dangerouslySetInnerHTML={{__html: `
          .foo { border-collapse: collapse; }
        `}} />
        <div className="c-datatable">
          <table>
            <caption>Stats by foo</caption>
            <thead>
              <tr>
                <th scope="col">Column 1</th>
                <th scope="col">Column 2</th>
                <th scope="col">Column 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">data1a</th>
                <td>data1b</td>
                <td>data1c</td>
              </tr>
              <tr>
                <th scope="row">data2a</th>
                <td>data2b</td>
                <td>data2c</td>
              </tr>
              <tr>
                <th scope="row">data3a</th>
                <td>data3b</td>
                <td>data3c</td>
              </tr>
              <tr>
                <th scope="row">data4a</th>
                <td>data4b</td>
                <td>data4c</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}
