import React from 'react'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'

import EditableMainContentComp from '../components/EditableMainContentComp.jsx'

class UnitProfileLayout extends React.Component {
  // onSaveContent(newText, adminLogin) {
  //   console.log(this.props.fetchPageData());
  //   return $
  //     .ajax({ url: `/api/unit/${this.props.unit.id}/${this.props.data.nav_element}`,
  //           type: 'PUT', data: { token: adminLogin.token, newText: newText }})
  //     .done(()=>{
  //       this.props.fetchPageData()  // re-fetch page state after DB is updated
  //     })
  // }
  
  
  render() {
    var data = this.props.data;
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
    var buttonPlacement = {
      marginTop: '-15px'
    }
    return (
      <div className="c-columns">
        <main>
          <section className="o-columnbox1">
            <Subscriber channel="cms">
              { cms =>
                <div style={{width: '550px'}}>
                  <label style={labelStyle}>Name: </label>
                  <input style={style} type="text" value={data.name}/>
                
                  <label style={labelStyle}>Slug (behind the last "/" in your URL):</label>
                  <input style={style} type="text" value={data.slug}/>
                
                  <label style={labelStyle}>Logo Banner: <span style={{color: '#555'}}>{data.logo}</span></label>
                  <div style={{marginBottom: '20px', color: '#555', width: '100%'}}>
                    <button>Choose File</button> 
                    <button>Remove File</button>
                  </div>
                  
                  <label style={labelStyle}>Facebook Page: </label>
                  <input style={style} type="text" value={data.facebook}/>
                
                  <label style={labelStyle}>Twitter Username: </label>
                  <input style={style} type="text" value={data.twitter}/>
                
                  <button>Save Changes</button> <button>Cancel</button>
                </div>
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

module.exports = UnitProfileLayout