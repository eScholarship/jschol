import React from 'react'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'

import ScholWorksComp from '../components/ScholWorksComp.jsx'
import SortPaginationComp from '../components/SortPaginationComp.jsx'
import ShareComp from '../components/ShareComp.jsx'

class SeriesLayout extends React.Component {
  static propTypes = {
    unit: React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      name: React.PropTypes.string,
      type: React.PropTypes.string,
      extent: React.PropTypes.object
    }).isRequired,
    data: React.PropTypes.shape({
      count: React.PropTypes.number,
      query: React.PropTypes.object,
      searchResults: React.PropTypes.array,
      series: React.PropTypes.array
    }),
    marquee: React.PropTypes.shape({
      carousel: React.PropTypes.object,
      about: React.PropTypes.string
    })
  }
  
  render() {
    var data = this.props.data;
    return (
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <h4>Other series in this department: </h4>
            <ul>
              { data.series.map((s) => 
                <li key={s.unit_id}><Link to={"/unit/"+s.unit_id}>{s.name}</Link></li>)}
            </ul>
            <Subscriber channel="cms">
              { cms => 
                <p className={cms.isEditingPage && "editable-outline"}>Some about text for the series. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos quo error expedita nobis modi a non, accusantium, ut at assumenda. Obcaecati sequi ducimus sint tenetur laboriosam alias corporis temporibus error? Nemo doloremque, possimus neque ea suscipit consectetur, ducimus ad veritatis laborum quia sunt modi accusamus pariatur sed. Blanditiis est, distinctio ad aut, quo doloremque voluptatibus consequatur ipsa placeat dolorum necessitatibus?</p>  
              }
            </Subscriber>
            <SortPaginationComp query={data.query} count={data.count}/>
            <div>
              { data.searchResults.map(result =>
                <ScholWorksComp key={result.id} result={result} />)
              }
            </div>
          </section>
        </main>
        <aside>
          <section className="o-columnbox1">
            <ShareComp type="unit" id={this.props.unit.id} />
          </section>
          {this.props.sidebar}
        </aside>
      </div>
    )
  }
}

module.exports = SeriesLayout
