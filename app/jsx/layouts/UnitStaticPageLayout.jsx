import React from 'react'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'

import EditableMainContentComp from '../components/EditableMainContentComp.jsx'

class UnitStaticPageLayout extends React.Component {
  onSaveContent(newText, adminLogin) {
    console.log(this.props.fetchPageData());
    return $
      .ajax({ url: `/api/unit/${this.props.unit.id}/${this.props.data.nav_element}`,
            type: 'PUT', data: { token: adminLogin.token, newText: newText }})
      .done(()=>{
        this.props.fetchPageData()  // re-fetch page state after DB is updated
      })
  }
  
  
  render() {
    var data = this.props.data;
    console.log(data.attrs.html);
    return (
      <div className="c-columns">
        <main>
          <section className="o-columnbox1">
            <Subscriber channel="cms">
              { cms =>
                <EditableMainContentComp onSave={(newText)=>this.onSaveContent(newText, cms.adminLogin)}
                  html={data.attrs.html} title={data.title}/>
              }
            </Subscriber>
          </section>
        </main>
        <aside>
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
        </aside>
      </div>
    )
  }
}

module.exports = UnitStaticPageLayout