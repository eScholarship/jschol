import React from 'react'
import { Link } from 'react-router'

import ScholWorksComp from '../components/ScholWorksComp.jsx'
import SortComp from '../components/SortComp.jsx'
import PaginationComp from '../components/PaginationComp.jsx'
import ShareComp from '../components/ShareComp.jsx'

// TODO: this is basically a copy of the Series Landing page layout without the header content
// probably should just be the same component, curious how search within a series differs from
// the landing page does the header content go away? 
// ie: what happens on pagination on the landing page? on search within pages? 
// TODO: UX - we need counts!

class UnitSearchLayout extends React.Component {
  render() {
    var data = this.props.data;
    return (
      <div className="c-columns">
        <main>
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

module.exports = UnitSearchLayout