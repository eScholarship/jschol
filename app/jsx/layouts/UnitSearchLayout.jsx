import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import ScholWorksComp from '../components/ScholWorksComp.jsx'
import SortPaginationComp from '../components/SortPaginationComp.jsx'
import ShareComp from '../components/ShareComp.jsx'

// [********** AW - 3/15/17 **********]
// TODO: this is basically a copy of the Series Landing page layout without the header content
// probably should just be the same component, curious how search within a series differs from
// the landing page - does the header content go away? 
// ie: what happens on pagination on the landing page? on search within pages? 
// TODO: UX - we need counts someplace! they never made it into the wireframes for this page
// TODO: make the forms actually functional - in standard search there is a facet form and 
// all the sort, pagination, and number of results per page form elements tie into it
// either create a new 'facetForm' or make a new form and change the components
// going here: http://0.0.0.0:4001/unit/uclalaw/search?q=equality&rows=20 displays 'show: 20' correctly, 
// but clicking 'show: 10' doesn't do anything. also where does 'equality' show in the UI? 

class UnitSearchLayout extends React.Component {
  static propTypes = {
    unit: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired
    }).isRequired,
    data: PropTypes.shape({
      count: PropTypes.number.isRequired,
      searchResults: PropTypes.array.isRequired,
      query: PropTypes.shape({
        q: PropTypes.string,
        rows: PropTypes.string,
        sort: PropTypes.string,
        start: PropTypes.string,
        filters: PropTypes.shape({
          departments: PropTypes.shape({
            display: PropTypes.string,
            fieldName: PropTypes.string,
            filters: PropTypes.array
          })
        })
      }).isRequired,
    })
  }
  
  render() {
    var data = this.props.data;
    return (
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <SortPaginationComp query={data.query} count={data.count}/>
            <div>
              { data.searchResults.map(result =>
                <ScholWorksComp h="h2" key={result.id} result={result} />)
              }
            </div>
          </section>
        </main>
        <aside>
          <section className="o-columnbox2">
            <ShareComp />
          </section>
          {this.props.sidebar}
        </aside>
      </div>
    )
  }
}

export default UnitSearchLayout
