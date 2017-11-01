import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'

import MarqueeComp from '../components/MarqueeComp.jsx'
import ShareComp from '../components/ShareComp.jsx'
import PubComp from '../components/PubComp.jsx'

class SeriesComp extends React.Component {
  static propTypes = {
    data: PropTypes.shape({
      unit_id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
      previewLimit: PropTypes.number.isRequired,
      items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        abstract: PropTypes.string,
        authors: PropTypes.array,
        content_type: PropTypes.string,
        supp_files: PropTypes.array
      })).isRequired
    })
  }
  
  render() {
    let data = this.props.data,
        plural = (data.count == data.previewLimit + 1) ? '' : 's'
    return (
      <details className="c-togglecontent c-unitseries">
      <summary><Link to={"/uc/"+data.unit_id}>{data.name} ({data.count})</Link></summary>
      {data.items.map((item) =>
        <PubComp key={item.id} result={item} h="H3" />) }
      {data.count > data.previewLimit &&
        <div className="c-unitseries__publications2">{data.count - data.previewLimit} more work{plural} &mdash; <Link to={"/uc/"+data.unit_id}>show all</Link></div> }
      </details>
    )
  }
}

class DepartmentLayout extends React.Component {
  static propTypes = {
    unit: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      extent: PropTypes.object
    }).isRequired,
    data: PropTypes.shape({
      series: PropTypes.array.isRequired,  //See SeriesComp directly above for Array element structure
      monograph_series: PropTypes.array.isRequired,  //See SeriesComp directly above for Array element structure
      journals: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        unit_id: PropTypes.string
      })),
      related_orus: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        unit_id: PropTypes.string
      })),
    }).isRequired,
    marquee: PropTypes.shape({
      carousel: PropTypes.any,
      about: PropTypes.about
    })
  }
  
  seriesCompListMaker = (data) => {
    let compList = []
    for (let s in data) {
      if (data[s].items.length > 0) {
        compList.push(<SeriesComp key={data[s].unit_id} data={data[s]}/>);
      }
    }
    return compList
  }

  render() {
    let data = this.props.data,
        seriesList = this.seriesCompListMaker(data.series),
        monographSeriesList = this.seriesCompListMaker(data.monograph_series)
    let marquee = this.props.marquee
    return (
      <div>
      {((marquee.carousel && marquee.slides) || marquee.about) &&
        <MarqueeComp marquee={marquee} />
      }
        <div className="c-columns">
          <main id="maincontent">
            <section className="o-columnbox1">
              <header>
                <h2>Works by the {this.props.unit.name}</h2>
              </header>
              <div className="c-itemactions">
                <ShareComp type="unit" id={this.props.unit.id} />
              </div>
            {(seriesList.length == 0 && monographSeriesList.length ==  0 && data.journals.length == 0 && data.related_orus.length == 0) ?
              <div className="c-unitseries__publications1">There are currently no publications in this collection.</div>
             :
              <div className="c-unitseries__publications1">There are {this.props.unit.extent.count} publications in this collection, published between {this.props.unit.extent.pub_year.start} and {this.props.unit.extent.pub_year.end}.</div>
            }
            {seriesList.length > 0 && seriesList}
            {monographSeriesList.length > 0 && monographSeriesList}
            {data.journals.length > 0 && 
              <div className="c-unitlist">
                <h3>Journals</h3>
                <ul>{ data.journals.map((child) =>
                  <li key={child.unit_id}><Link to={"/uc/"+child.unit_id}>{child.name}</Link></li>) } </ul>
              </div>
            }
            {data.related_orus.length > 0 &&
              <div className="c-unitlist">
                <h3>Related Research Centers & Groups</h3>
                <ul>
                  { data.related_orus.map((child) =>
                    <li key={child.unit_id}><Link to={"/uc/"+child.unit_id}>{child.name}</Link></li>) }
                </ul>
              </div>
            }
            </section>
          </main>
          <aside>
            {this.props.sidebar}
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = DepartmentLayout
