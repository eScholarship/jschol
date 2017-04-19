import React from 'react'
import { Link } from 'react-router'

import ScholWorksComp from '../components/ScholWorksComp.jsx'
import SortComp from '../components/SortComp.jsx'
import PaginationComp from '../components/PaginationComp.jsx'
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
    unit: React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      name: React.PropTypes.string.isRequired,
      type: React.PropTypes.string.isRequired
    }).isRequired,
    data: React.PropTypes.shape({
      count: React.PropTypes.number.isRequired,
      searchResults: React.PropTypes.array.isRequired,
      query: React.PropTypes.shape({
        q: React.PropTypes.string,
        rows: React.PropTypes.string,
        sort: React.PropTypes.string,
        start: React.PropTypes.string,
        filters: React.PropTypes.shape({
          departments: React.PropTypes.shape({
            display: React.PropTypes.string,
            fieldName: React.PropTypes.string,
            filters: React.PropTypes.array
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
            <ShareComp />
          </section>
          <section className="o-columnbox1">
            <header>
              <h2>Featured Articles</h2>
            </header>
            <p><a className="o-textlink__secondary" href="">Entre la ficción y el periodismo: Cambio social y la crónica mexicana contemporánea</a> <br/> Nadeau, Evelyn</p> 
            <p><a className="o-textlink__secondary" href="">Journalism in Catalonia During Francoism</a> <br/> Reguant, Monserrat</p>
            <p><a className="o-textlink__secondary" href="">En torno a un cuento olvidado de Clarín: "El oso mayor"</a> <br/> Gil, Angeles Ezama</p>
            <p><a className="o-textlink__secondary" href="">Interview with Guillermo Cabrera Infante</a> <br/> Graham-Jones, Jean; Deosthale, Duleep</p>
            <p><a className="o-textlink__secondary" href="">Lazlo Moussong. Castillos en la letra. Xalapa, México: Universidad Veracruzana, 1986.</a> <br/> Radchik, Laura</p>
          </section>
          <section className="o-columnbox1">
            <header>
              <h2>Related Departments in eScholarship</h2>
            </header>
            [content to go here]
          </section>
          <section className="o-columnbox1">
            <header>
              <h2>Follow us on Twitter</h2>
            </header>
            [content to go here]
          </section>
        </aside>
      </div>
    )
  }
}

module.exports = UnitSearchLayout