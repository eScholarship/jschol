import React from 'react'
import { Link } from 'react-router'

import Header2Comp from '../components/Header2Comp.jsx'
import Subheader1Comp from '../components/Subheader1Comp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import CarouselComp from '../components/MarqueeComp.jsx'

class SeriesComp extends React.Component {
  render() {
    return (
      <div>
      <h4>{this.props.data.name}</h4>
      <ul>
      { this.props.data.items.map((item) =>
        <li key={item.item_id}><Link to={"/item/"+item.item_id.replace(/^qt/, "")}>{item.title}</Link></li>) }
      </ul>
      <p>{this.props.data.count-3} more works - show all</p>
      </div>
    )
  }
}

class DepartmentLayout extends React.Component {
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
        <Header2Comp level="unit"
                    isJournal = {data.isJournal}
                    campusID={data.campusID}
                    campusName={data.campusName}
                    campuses={data.campuses}
                    unit_id={data.id}/>
        <Subheader1Comp type={data.type}
                        unitID={data.id}
                        unitName={data.name}
                        campusID={data.campusID}
                        campusName={data.campusName}
                        campuses={data.campuses} /> 
        <BreadcrumbComp array={data.breadcrumb}/>
        <CarouselComp />
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <p>There are {data.extent.count} publications in this collection, published between {data.extent.pub_year.start} and {data.extent.pub_year.end}.</p>
              <h3>Works by {data.name}</h3>
              {seriesList}
              <hr/>
              <h3>Related Research Centers & Groups</h3>
              <ul>
                { data.related_orus.map((child) =>
                  <li key={child.unit_id}><Link to={"/unit/"+child.unit_id}>{child.name}</Link></li>) }
              </ul>
            </section>
          </main>
          <aside>
            <section className="o-columnbox2">
            </section>
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = DepartmentLayout