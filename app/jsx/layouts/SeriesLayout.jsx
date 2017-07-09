import React from 'react'
import PropTypes from 'prop-types'
import { Link, browserHistory } from 'react-router'
import { Subscriber } from 'react-broadcast'

import ScholWorksComp from '../components/ScholWorksComp.jsx'
import SortPaginationComp from '../components/SortPaginationComp.jsx'
import PaginationComp from '../components/PaginationComp.jsx'
import ShareComp from '../components/ShareComp.jsx'
import Form from 'react-router-form'

// [********** AJM - 7/03/17 **********]
// TODO: If UnitSearchLayout is going to be resuscitated, should this layout be wrapped into it?

class SeriesSelector extends React.Component {
  render() {
    return (
      <div className="o-input__droplist1">
        <label htmlFor="c-sort1">Select</label>
        <select name="" id="c-sort1" value={this.props.unit.id} onChange={(e)=>{browserHistory.push("/uc/"+e.target.value)}}>
        { this.props.data.series.map((s) => 
          <option key={s.unit_id} value={s.unit_id}>{s.name}</option>)}
        </select>
      </div>
    )
  }
}

class SeriesLayout extends React.Component {
  static propTypes = {
    unit: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      type: PropTypes.string,
      extent: PropTypes.object
    }).isRequired,
    data: PropTypes.shape({
      count: PropTypes.number.isRequired,
      query: PropTypes.shape({
        q: PropTypes.string,
        rows: PropTypes.string,
        sort: PropTypes.string,
        start: PropTypes.string,
      }).isRequired,
      searchResults: PropTypes.array.isRequired,
      series: PropTypes.array
    }).isRequired,
    marquee: PropTypes.shape({
      carousel: PropTypes.object,
      about: PropTypes.string
    })
  }

  // Set as the Form's onSubmit handler
  handleSubmit = (event, formData)=>{
    for(let key in formData) {
      if (formData[key] == "" ||
      (key === 'sort' && formData[key] === 'rel') ||
      (key === 'rows' && formData[key] === '10') ||
      (key === 'start' && formData[key] === '0')) {
        delete formData[key]
      }
    }
    // Handy for debugging
    // console.log(JSON.stringify(formData))
    return true
  }
 
  render() {
    let data = this.props.data,
        formName = "seriesForm",
        formButton = "series-form-submit"
    return (
      <div className="c-columns">
        {/* No marquee component used in series layout. But note marquee.about data used below */}
        <main id="maincontent">
          <section className="o-columnbox1">
            <div className="c-itemactions">
              <SeriesSelector unit={this.props.unit} data={data} />
              <ShareComp type="unit" id={this.props.unit.id} />
            </div>
          {this.props.marquee.about &&
            <p dangerouslySetInnerHTML={{__html: this.props.marquee.about}}/>
          }
          {this.props.data.count == 0 ? 
            <p><hr/><br/><br/>There are currently no publications in this series &quot;{this.props.unit.name}&quot;.</p>
           :
            <Form id={formName} to={"/uc/"+this.props.unit.id+"/search"} method="GET" onSubmit={this.handleSubmit}>
            {(this.props.data.count > 2) &&
              <SortPaginationComp formName={formName} formButton={formButton} query={data.query} count={data.count}/>
            }
              <div>
                { data.searchResults.map(result =>
                  <ScholWorksComp key={result.id} result={result} />)
                }
              </div>
            {(data.count > data.query.rows) &&
              <PaginationComp formName={formName} formButton={formButton} query={data.query} count={data.count}/>
            }
              {/* Submit button needs to be present so our logic can "press" it at certain times.
                  But hide it with display:none so user doesn't see it. */}
              <button type="submit" id={formButton} style={{display: "none"}}>Search</button>
            </Form>
          }
          </section>
        </main>
        <aside>
          {this.props.sidebar}
        </aside>
      </div>
    )
  }
}

module.exports = SeriesLayout
