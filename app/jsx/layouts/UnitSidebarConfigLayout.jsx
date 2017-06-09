import React from 'react'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'

import EditableMainContentComp from '../components/EditableMainContentComp.jsx'

class UnitSidebarConfigLayout extends React.Component {
  render() {
    var style = {
      marginBottom: '20px',
      padding: '6px 12px',
      lineHeight: '1.4',
      color: '#555',
      border: '1px solid #ccc',
      borderRadius: '4px',
      width: '100%'
    }
    var labelStyle = {
      fontWeight: '700',
      marginBottom: '5px',
      display: 'block'
    }
    return (
      <div>
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <header id="featured-articles">
              <h2 style={{background: '#147a8d', color: 'white'}}>Configure the Featured Articles Widget</h2>
            </header>
            <div style={{width: "600px"}}>
              <label style={labelStyle}>Article 1</label>
              <input type="text" style={style} defaultValue="Entre la ficción y el periodismo: Cambio social y la crónica mexicana contemporánea"/>
              <label style={labelStyle}>Article 2</label>
              <input type="text" style={style} defaultValue="Journalism in Catalonia During Francoism"/>
              <label style={labelStyle}>Article 3</label>
              <input type="text" style={style} defaultValue="En torno a un cuento olvidado de Clarín: &quot;El oso mayor&quot;"/>
              <label style={labelStyle}>Article 4</label>
              <input type="text" style={style} defaultValue="Interview with Guillermo Cabrera Infante"/>
              <label style={labelStyle}>Article 5</label>
              <input type="text" style={style} defaultValue="Lazlo Moussong. Castillos en la letra. Xalapa, México: Universidad Veracruzana, 1986."/>
              <button>Save</button> <button>Cancel</button>
            </div>
          </section>
        </main>
        <aside>
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
        </aside>
      </div>
      <div className="c-columns">
        <main>
          <section className="o-columnbox1">
            <header id="twitter-feed">
              <h2 style={{background: '#147a8d', color: 'white'}}>Configure the Twitter Feed Widget</h2>
            </header>
              <div style={{width: "600px"}}>
                <label style={labelStyle}>Twitter Username</label>
                <input type="text" style={style} defaultValue="" placeholder="Enter your twitter username"/>
                <button>Save</button> <button>Cancel</button>
              </div>
          </section>
        </main>
        <aside>
          <section className="o-columnbox1">
            <header>
              <h2>Follow us on Twitter</h2>
            </header>
            [content to go here]<br/>
            [content to go here]<br/>
            [content to go here]<br/>
            [content to go here]<br/>
            [content to go here]<br/>
            [content to go here]<br/>
            [content to go here]<br/>
            [content to go here]<br/>
            [content to go here]<br/>
          </section>
        </aside>
      </div>
      <div className="c-columns">
        <main>
          <section className="o-columnbox1">
            <header id="other-widgets">
              <h2 style={{background: '#147a8d', color: 'white'}}>Configure other widget</h2>
            </header>
            <p>Configuration options for other widgets?</p>
            <button>Save</button> <button>Cancel</button>
          </section>
        </main>
        <aside>
          <section className="o-columnbox1">
            <header>
              <h2>Other Widget</h2>
            </header>
            [content to go here]<br/>
            [content to go here]<br/>
            [content to go here]<br/>
            [content to go here]<br/>
            [content to go here]<br/>
            [content to go here]<br/>
            [content to go here]<br/>
            [content to go here]<br/>
          </section>
        </aside>
      </div>

      </div>
    )
  }
}

module.exports = UnitSidebarConfigLayout