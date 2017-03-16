import React from 'react'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'

import ScholWorksComp from '../components/ScholWorksComp.jsx'
import SortComp from '../components/SortComp.jsx'
import PaginationComp from '../components/PaginationComp.jsx'
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
        <main>
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
            <div className="l-search__sort-pagination">
              <SortComp query={data.query} />
              <input type="hidden" name="start" form="facetForm" value={data.query.start} />
              <PaginationComp query={data.query} count={data.count}/>
            </div>
            <div>
              { data.searchResults.map(result =>
                <ScholWorksComp key={result.id} result={result} />)
              }
            </div>
          </section>
        </main>
        <aside>
          <section className="o-columnbox2">
            <ShareComp type="unit" id={this.props.unit.id} />
          </section>
          <section className="o-columnbox2">
            <header>
              <h2 className="o-columnbox2__heading">Featured Articles</h2>
              </header>
              <p><a className="o-textlink__secondary" href="">Entre la ficción y el periodismo: Cambio social y la crónica mexicana contemporánea</a> <br/> Nadeau, Evelyn</p> 
              <p><a className="o-textlink__secondary" href="">Journalism in Catalonia During Francoism</a> <br/> Reguant, Monserrat</p>
              <p><a className="o-textlink__secondary" href="">En torno a un cuento olvidado de Clarín: "El oso mayor"</a> <br/> Gil, Angeles Ezama</p>
              <p><a className="o-textlink__secondary" href="">Interview with Guillermo Cabrera Infante</a> <br/> Graham-Jones, Jean; Deosthale, Duleep</p>
              <p><a className="o-textlink__secondary" href="">Lazlo Moussong. Castillos en la letra. Xalapa, México: Universidad Veracruzana, 1986.</a> <br/> Radchik, Laura</p>
          </section>
          <section className="o-columnbox2">
            <header>
              <h2 className="o-columnbox2__heading">Related Departments in eScholarship</h2>
            </header>
            [content to go here]
          </section>
          <section className="o-columnbox2">
            <header>
              <h2 className="o-columnbox2__heading">Follow us on Twitter</h2>
            </header>
            [content to go here]
          </section>
        </aside>
      </div>
    )
  }
}

module.exports = SeriesLayout
