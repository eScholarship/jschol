import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'

import ScholWorksComp from '../components/ScholWorksComp.jsx'
import SortPaginationComp from '../components/SortPaginationComp.jsx'
import PaginationComp from '../components/PaginationComp.jsx'
import ShareComp from '../components/ShareComp.jsx'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import Form from 'react-router-form'

// [********** AJM - 7/03/17 **********]
// TODO: If UnitSearchLayout is going to be resuscitated, should this layout be wrapped into it?

class SeriesSelector extends React.Component {
  static propTypes = {
    unit: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
      extent: PropTypes.object
    }).isRequired,
    series: PropTypes.array.isRequired
    // unit_id: PropTypes.string.isRequired,
    // name: PropTypes.string.isRequired
  }
 
  state = { isOpen: false }

  closeSelector() {
    this.setState({isOpen: false})
  }

  render() {
    let p = this.props
    return (
      <div className="o-customselector">
        <Link to={"/uc/" + p.unit.id} className="o-customselector__heading">{p.unit.name}</Link>
        <details open={this.state.isOpen}
                 ref={domElement => this.details=domElement}
                 onClick={()=>setTimeout(()=>this.setState({isOpen: this.details.open}), 0)}
                 className="o-customselector__selector">
          <summary aria-label="Select a different series"></summary>
          <div className="o-customselector__menu">
            <ul className="o-customselector__items" role="list">
              {p.series.map((s, i) =>
                <li><Link key={i} to={"/uc/"+ s.unit_id} onClick={()=>this.closeSelector()}>{s.name}</Link></li> )}
            </ul>
          </div>
        </details>
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
        unit = this.props.unit,
        selectorList = data.series.filter(function(s){ return (s.unit_id != unit.id) }),
        formName = "seriesForm",
        formButton = "series-form-submit"
    return (
      <div className="c-columns">
        {/* No marquee component used in series layout. But note marquee.about data used below */}
        <main id="maincontent">
          <section className="o-columnbox1">
            <div className="c-itemactions">
            {data.series.length > 1 ?
              <SeriesSelector unit={unit} series={selectorList} />
            :
              <h3 className="o-heading3">{unit.name}</h3>
            }
              <ShareComp type="unit" id={unit.id} />
            </div>
          {this.props.marquee.about &&
            <ArbitraryHTMLComp html={this.props.marquee.about} h1Level={2}/>
          }
          {this.props.data.count == 0 ? 
            <div><hr/>
              <p><br/><br/>There are currently no publications in this series &quot;{unit.name}&quot;.</p></div>
           :
            <Form id={formName} to={"/uc/"+this.props.unit.id+"/search"} method="GET" onSubmit={this.handleSubmit}>
            {(this.props.data.count > 2) &&
              <SortPaginationComp formName={formName} formButton={formButton} query={data.query} count={data.count}relQueryOff={true} />
            }
              <div>
                { data.searchResults.map(result =>
                  <ScholWorksComp h="h2" key={result.id} result={result} />)
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
        {this.props.sidebar }
        </aside>
      </div>
    )
  }
}

module.exports = SeriesLayout
