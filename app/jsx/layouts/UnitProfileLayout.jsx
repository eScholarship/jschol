import React from 'react'
import { Link } from 'react-router'
import Form from 'react-router-form'

import MarqueeComp from '../components/MarqueeComp.jsx'

class UnitProfileLayout extends React.Component {

  handleSubmit = (event, formData) => {
    event.preventDefault()
    this.props.sendApiData("PUT", event.target.action, { data: formData })
  }

  render() {
    var data = this.props.data;
    var journalConfigOpts;
    return (
      <div>
        <h3>Unit Configuration</h3>
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <Form to="" onSubmit={this.handleSubmit}>
                <label className="c-editable-page__label">Name: </label>
                <input className="c-editable-page__input" type="text" defaultValue={data.name}/>

                <label className="c-editable-page__label">Logo image:</label>
                { data.logo
                  ? <img src={"/assets/"+data.logo.asset_id} width={data.logo.width} height={data.logo.height} alt="Logo image" />
                  : <img src="http://placehold.it/400x100?text=No+logo" width="400" height="100" alt="Missing logo image" />
                }

                <div>
                  <button>Choose File</button>
                  <button>Remove File</button>
                </div>
                <br/>

                { this.props.unit.type == 'journal' &&
                  <div>
                    <label className="c-editable-page__label" htmlFor="doajSeal">DOAJ Seal: </label>
                    <input type="checkbox" id="doajSeal" name="doajSeal" defaultChecked={data.doaj}/>
                    <br/><br/>
                    <label className="c-editable-page__label" htmlFor="license">License: </label>
                    <input className="c-editable-page__input" id="license" name="license" type="text" defaultValue={data.license}/>
                    <label className="c-editable-page__label">E-ISSN: </label>
                    <input className="c-editable-page__input" type="text" defaultValue={data.eissn}/>
                  </div>
                }

                <button type="submit">Save Changes</button>
              </Form>
            </section>
          </main>
        </div>
        <h3>Social Configuration</h3>
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <div>
                <label className="c-editable-page__label" htmlFor="facebook">Facebook Page: </label>
                <input className="c-editable-page__input" id="facebook" name="facebook" type="text" defaultValue={data.facebook}/>

                <label className="c-editable-page__label" htmlFor="twitter">Twitter Username: </label>
                <input className="c-editable-page__input" id="twitter" name="twitter" type="text" defaultValue={data.twitter}/>

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
              <div>
                <h4>Carousel Configuration</h4>
                {/* TO DO: add htmlFor and id+name below; make everything actually work */}
                <label className="c-editable-page__label">Show Carousel? <input type="checkbox" defaultChecked/></label>
                <label className="c-editable-page__label">Header:</label>
                <input className="c-editable-page__input" type="text" defaultValue="Carousel Cell Title 1"/>

                <label className="c-editable-page__label">Text:</label>
                <textarea className="c-editable-page__input" defaultValue="Magnam praesentium sint, ducimus aspernatur architecto, deserunt ipsa veniam quia nihil, doloribus, laudantium a ad error tenetur fuga consequuntur laboriosam omnis ipsam."/>

                <label className="c-editable-page__label">Image: <span style={{color: '#555'}}>img1.jpg</span></label>
                <div style={{marginBottom: '20px', color: '#555', width: '100%'}}>
                  <button>Choose File</button>
                  <button>Remove File</button>
                </div>

                <label className="c-editable-page__label">About Text</label>
                <textarea className="c-editable-page__input" defaultValue={data.about}/>
              </div>
            </section>
          </main>
        </div>

        { this.props.unit.type == 'oru' &&
          <div>
            <h3>Main Content Configuration</h3>
            <div className="c-columns">
              <main id="maincontent">
                <section className="o-columnbox1">
                  <div>
                    Here you can suppress a given series, and reorder series.
                    <br/><i>(not yet implemented)</i>
                  </div>
                </section>
              </main>
            </div>
          </div>
        }

        { this.props.unit.type == 'journal' &&
          <div>
            <h3 id="main-content-config">Main Content Configuration</h3>
            <div className="c-columns">
              <main>
                <section className="o-columnbox1">
                  <Form to={`/api/unit/${this.props.unit.id}/profileContentConfig`} onSubmit={this.handleSubmit}>
                    <label className="c-editable-page__label" htmlFor="magazine_layout">Magazine layout?</label>
                    <input type="checkbox" id="magazine_layout" name="magazine_layout" defaultChecked={data.magazine_layout}/>
                    <p>(leave this unchecked for simple layout)</p>
                    <p>Display Issue Rule:</p>
                    <input className="c-editable-page__radio" type="radio"
                           id="issueRuleFirstMostRecent" name="issue_rule" value="firstMostRecent"
                           defaultChecked={data.issue_rule!="secondMostRecent"}/>
                    <label className="c-editable-page__radio-label" htmlFor="issueRuleFirstMostRecent">Most recent issue</label>
                    <input className="c-editable-page__radio" type="radio"
                           id="issueRuleSecondMostRecent" name="issue_rule" value="secondMostRecent"
                           defaultChecked={data.issue_rule=="secondMostRecent"}/>
                    <label className="c-editable-page__radio-label" htmlFor="issueRuleSecondMostRecent">Second-most recent issue</label>
                    <br/><br/>
                    <button>Save Changes</button> <button>Cancel</button>
                  </Form>
                </section>
              </main>
            </div>
          </div>
        }
      </div>
    )
  }
}

module.exports = UnitProfileLayout