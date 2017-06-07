import React from 'react'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'

import MarqueeComp from '../components/MarqueeComp.jsx'

class UnitProfileLayout extends React.Component {
  // onSaveContent(newText, adminLogin) {
  //   console.log(this.props.fetchPageData());
  //   return $
  //     .ajax({ url: `/api/unit/${this.props.unit.id}/${this.props.data.slug}`,
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
    
    var mainContentConfig;
    var journalConfigOpts;
    if (this.props.unit.type == 'oru') {
      mainContentConfig = <div>
        <h3>Main Content Configuration</h3>
        <div className="c-columns">
          <main id="maincontent">
            <section className="o-columnbox1">
              <div style={{width: '550px'}}>
                Here you can suppress a given series, and reorder series. 
              </div>
            </section>
          </main>
        </div>
      </div>
    } else if (this.props.unit.type == 'journal') {
      mainContentConfig = <div>
        <h3 id="main-content-config">Main Content Configuration</h3>
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <div style={{width: '550px'}}>
                <label style={labelStyle}>Magazine layout? <input type="checkbox"/></label>
                <p>Leave this unchecked for simple layout</p>
                <label style={labelStyle}>Display Issue Rule: </label>
                <label style={labelStyle}><input type="radio"/> Most recent issue</label>
                <label style={labelStyle}><input type="radio"/> Second most recent issue</label>
              </div>
            </section>
          </main>
        </div>
      </div>
      journalConfigOpts = <div>
        <label style={labelStyle}>DOAJ Seal: </label>,
        <input style={style} type="text" defaultValue={data.doaj}/>,
        <label style={labelStyle}>License: </label>,
        <input style={style} type="text" defaultValue={data.license}/>,
        <label style={labelStyle}>E-ISSN: </label>,
        <input style={style} type="text" defaultValue={data.eissn}/>
      </div>
    }
    return (
      <Subscriber channel="cms">
        { cms =>
          <div>
          <h3>Unit Configuration</h3>
          <div className="c-columns">
            <main>
              <section className="o-columnbox1">
                <div style={{width: '550px'}}>
                  <label style={labelStyle}>Name: </label>
                  <input style={style} type="text" defaultValue={data.name}/>

                  <label style={labelStyle}>Slug (behind the last "/" in your URL):</label>
                  <input style={style} type="text" defaultValue={data.slug}/>

                  <label style={labelStyle}>Logo image:</label>
                  { data.logo
                    ? <img src={"/assets/"+data.logo.asset_id} width={data.logo.width} height={data.logo.height} alt="Logo image" />
                    : <img src="http://placehold.it/400x100?text=No+logo" width="400" height="100" alt="Missing logo image" />
                  }

                  <div style={{marginBottom: '20px', color: '#555', width: '100%'}}>
                    <button>Choose File</button> 
                    <button>Remove File</button>
                  </div>

                  {journalConfigOpts}

                  <button>Save Changes</button> <button>Cancel</button>
                </div>
              </section>
            </main>
          </div>
          <h3>Social Configuration</h3>
          <div className="c-columns">
            <main>
              <section className="o-columnbox1">
                <div style={{width: '550px'}}>
                  <label style={labelStyle}>Facebook Page: </label>
                  <input style={style} type="text" defaultValue={data.facebook}/>

                  <label style={labelStyle}>Twitter Username: </label>
                  <input style={style} type="text" defaultValue={data.twitter}/>

                  <button>Save Changes</button> <button>Cancel</button>
                </div>
              </section>
            </main>
          </div>
          <h3 id="marquee">Marquee Configuration</h3>
          <MarqueeComp marquee={{carousel: true, about: data.about}} unit={this.props.unit}/>
          <div className="c-columns">
            <main>
              <section className="o-columnbox1">
                <div style={{width: '550px'}}>
                  <h4>Carousel Configuration</h4>
                  <label style={labelStyle}>Show Carousel? <input type="checkbox" defaultChecked/></label>
                  <label style={labelStyle}>Header:</label>
                  <input style={style} type="text" defaultValue="Carousel Cell Title 1"/>
                
                  <label style={labelStyle}>Text:</label>
                  <textarea style={style} defaultValue="Magnam praesentium sint, ducimus aspernatur architecto, deserunt ipsa veniam quia nihil, doloribus, laudantium a ad error tenetur fuga consequuntur laboriosam omnis ipsam."/>
                
                  <label style={labelStyle}>Image: <span style={{color: '#555'}}>img1.jpg</span></label>
                  <div style={{marginBottom: '20px', color: '#555', width: '100%'}}>
                    <button>Choose File</button> 
                    <button>Remove File</button>
                  </div>
                  
                  <label style={labelStyle}>About Text</label>
                  <textarea style={style} defaultValue={data.about}/>
                </div>
              </section>
            </main>
          </div>
          {mainContentConfig}
          </div>
        }
      </Subscriber>
    )
  }
}

module.exports = UnitProfileLayout