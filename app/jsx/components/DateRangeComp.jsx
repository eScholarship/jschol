// ##### Date Range picker ##### //

import React from 'react'

export default class DateRangeComp extends React.Component {
  render() {
    return (
      <form method="GET" action="/uc/root/stats/history_by_unit">
        <div className="c-daterange">
          <div className="o-input__inline">
            <div className="o-input__droplist1">
              <label htmlFor="range">Date range</label>
              <select name="range" id="range">
                <option value="1mo">Last month</option>
                <option value="4mo">Last 4 months</option>
                <option value="12mo">Last 12 months</option>
                <option value="5yr">Last 5 years</option>
                <option value="all">All time</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          <div className="o-input__inline">
            <div className="o-input__droplist1">
              <label htmlFor="st_yr">Start year</label>
              <select name="st_yr" id="st_yr">
                 <option value="2002">2002</option>
                 <option value="2003">2003</option>
                 <option value="2004">2004</option>
                 <option value="2005">2005</option>
                 <option value="2006">2006</option>
                 <option value="2007">2007</option>
                 <option value="2008">2008</option>
                 <option value="2009">2009</option>
                 <option value="2010">2010</option>
                 <option value="2011">2011</option>
                 <option value="2012">2012</option>
                 <option value="2013">2013</option>
                 <option value="2014">2014</option>
                 <option value="2015">2015</option>
                 <option value="2016">2016</option>
                 <option value="2017">2017</option>
                 <option value="2018">2018</option>
              </select>
            </div>
            <div className="o-input__droplist1">
              <label htmlFor="st_mo">Start month</label>
              <select name="st_mo" id="st_mo">
                 <option value="01">January</option>
                 <option value="02">February</option>
              </select>
            </div>
            <div className="o-input__droplist1">
              <label htmlFor="en_yr">End year</label>
              <select name="en_yr" id="en_yr">
                 <option value="2002">2002</option>
                 <option value="2003">2003</option>
                 <option value="2004">2004</option>
                 <option value="2005">2005</option>
                 <option value="2006">2006</option>
                 <option value="2007">2007</option>
                 <option value="2008">2008</option>
                 <option value="2009">2009</option>
                 <option value="2010">2010</option>
                 <option value="2011">2011</option>
                 <option value="2012">2012</option>
                 <option value="2013">2013</option>
                 <option value="2014">2014</option>
                 <option value="2015">2015</option>
                 <option value="2016">2016</option>
                 <option value="2017">2017</option>
                 <option value="2018">2018</option>
              </select>
            </div>
            <div className="o-input__droplist1">
              <label htmlFor="en_mo">End month</label>
              <select name="en_mo" id="en_mo">
                 <option value="01">January</option>
                 <option value="02">February</option>
              </select>
            </div>
          </div>
          <button type="submit">Update</button>
        </div>
      </form>
    )
  }
}
