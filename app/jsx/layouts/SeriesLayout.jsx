import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'

import ScholWorksComp from '../components/ScholWorksComp.jsx'
import SortPaginationComp from '../components/SortPaginationComp.jsx'
import PaginationComp from '../components/PaginationComp.jsx'
import ShareComp from '../components/ShareComp.jsx'

class SeriesSelector extends React.Component {
  render() {
    return (
      <div className="o-input__droplist1">
        <label htmlFor="c-sort1">Select</label>
        <select name="" id="c-sort1">
        { this.props.data.series.map((s) => 
          <option key={s.unit_id} value={"/uc/"+s.unit_id}>{s.name}</option>)}
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
      count: PropTypes.number,
      query: PropTypes.object,
      searchResults: PropTypes.array,
      series: PropTypes.array
    }),
    marquee: PropTypes.shape({
      carousel: PropTypes.object,
      about: PropTypes.string
    })
  }
  
  render() {
    let data = this.props.data
    return (
      <div className="c-columns">
        {/* No marquee component used in series layout. But note marquee.about data used below */}
        <main id="maincontent">
          <section className="o-columnbox1">
            <div className="c-itemactions">
              <SeriesSelector data={data} />
              <ShareComp type="unit" id={this.props.unit.id} />
            </div>
          {this.props.marquee.about &&
            <p dangerouslySetInnerHTML={{__html: this.props.marquee.about}}/>
          }
          {(this.props.data.count > 2) &&
            <SortPaginationComp query={data.query} count={data.count}/>
          }
            <div>
              { data.searchResults.map(result =>
                <ScholWorksComp key={result.id} result={result} />)
              }
            </div>
          {(data.count > data.query.rows) &&
            <PaginationComp query={data.query} count={data.count}/>
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
