import React from 'react'
import { Link } from 'react-router'

import CarouselComp from '../components/MarqueeComp.jsx'

class IssueComp extends React.Component {
  render() {
    return (
      <div></div>
    )
  }
}

class JournalLayout extends React.Component {
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
        <CarouselComp />
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <IssueComp/>
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

module.exports = JournalLayout