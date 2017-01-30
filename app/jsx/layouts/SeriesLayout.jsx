import React from 'react'
import { Link } from 'react-router'

import CarouselComp from '../components/MarqueeComp.jsx'
import { ScholarlyWorks, SortComp, PaginationComp } from '../pages/SearchPage.jsx'

            // <div className="l-search__sort-pagination">
            //   <SortComp query={data.query} />
            //   <input type="hidden" name="start" form="facetForm" value={data.query.start} />
            //   <PaginationComp query={data.query} count={data.count}/>
            // </div>
            // <section className="o-columnbox1">
            //   <header>
            //     <h2 className="o-columnbox1__heading">Scholarly Works ({data.count} results)</h2>
            //   </header>
            //   <ScholarlyWorks results={data.searchResults} />
            // </section>


class SeriesLayout extends React.Component {
  render() {
    var data = this.props.data;
    return (
      <div className="c-columns">
        <main>
          <section className="o-columnbox1">
            <ul>
              { data.series.map((s) => 
                <li key={s.unit_id}><Link to={"/unit/"+s.unit_id}>{s.name}</Link></li>)}
            </ul>
            <p>Some about text for the series.</p>
                  
          </section>
        </main>
        <aside>
          <section className="o-columnbox2">
          </section>
        </aside>
      </div>
    )
  }
}

module.exports = SeriesLayout