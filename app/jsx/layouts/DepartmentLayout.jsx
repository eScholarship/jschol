import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'

import MarqueeComp from '../components/MarqueeComp.jsx'
import ShareComp from '../components/ShareComp.jsx'
import ScholWorksComp from '../components/ScholWorksComp.jsx'

class SeriesComp extends React.Component {
  static propTypes = {
    data: PropTypes.shape({
      count: PropTypes.number.isRequired,
      items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        
        abstract: PropTypes.string,
        authors: PropTypes.array,
        content_type: PropTypes.string,
        supp_files: PropTypes.array
      })).isRequired,
      name: PropTypes.string.isRequired,
      unit_id: PropTypes.string.isRequired
    })
  }
  
  render() {
    return (
      <div style={{marginBottom: '30px'}}>
        <h4>Series: <Link to={"/uc/"+this.props.data.unit_id}>{this.props.data.name}</Link></h4>
        <div style={{paddingLeft: '20px'}}>
          { this.props.data.items.map((item) =>
            <ScholWorksComp key={item.id} result={item}/>) }
          <p>{this.props.data.count-3} more works - <Link to={"/uc/"+this.props.data.unit_id}>show all</Link></p>
        </div>
      </div>
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
      journals: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        unit_id: PropTypes.string
      })),
      related_orus: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        unit_id: PropTypes.string
      })),
      series: PropTypes.array.isRequired  //See SeriesComp directly above for Array element structure
    }).isRequired,
    marquee: PropTypes.shape({
      carousel: PropTypes.any,
      about: PropTypes.about
    })
  }
  
  render() {
    var data = this.props.data;

    var seriesList = [];
    for (var s in data.series) {
      if (data.series[s].items.length > 0) {
        seriesList.push(<SeriesComp key={data.series[s].unit_id} data={data.series[s]}/>);
      }
    }

    return (
      <div>
        <MarqueeComp marquee={this.props.marquee} unit={this.props.unit}/>
        <div className="c-columns">
          <main id="maincontent">
            <section className="o-columnbox1">
            {(data.journals.length == 0 && seriesList.length == 0 && data.related_orus.length == 0) ?
              <p>There are currently no publications in this collection.</p>
              :
              <p>There are {this.props.unit.extent.count} publications in this collection, published between {this.props.unit.extent.pub_year.start} and {this.props.unit.extent.pub_year.end}.</p>
            }
            {data.journals.length > 0 && 
              <div><h3>Journals by {this.props.unit.name}</h3>
              <ul>
              { data.journals.map((child) =>
                <li key={child.unit_id}><Link to={"/uc/"+child.unit_id}>{child.name}</Link></li>) }
              </ul></div>
            }
            {seriesList.length > 0 &&
              <div>
                <h3>Works by {this.props.unit.name}</h3>
                {seriesList}
                <hr/>
              </div>
            }
            {data.related_orus.length > 0 &&
              <div>
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
            <section className="o-columnbox1">
              <ShareComp type="unit" id={this.props.unit.id} />
            </section>
            {this.props.sidebar}
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = DepartmentLayout
