import React from 'react'
import AboutComp from '../components/AboutComp.jsx'
import Form from 'react-router-form'
import { Subscriber } from 'react-broadcast'

class UnitProfileLayout extends React.Component {
  // static propTypes = {
  // }

  state = { newData: this.props.data }

  handleSubmit = (event, data) => {
    event.preventDefault()

    // adds input type="file" fields to FormData
    let binaryFormData = new FormData();
    let binaryFormFields = [];
    for (var fieldName in data) {
      if (data[fieldName] instanceof File) {
        binaryFormData.append(fieldName, data[fieldName]);
        binaryFormFields.push(fieldName);
      }
    }

    // removes input type="file" fields from 'data' parameter
    if (binaryFormFields.length !== 0) {
      for (var field in binaryFormFields) {
        delete data[binaryFormFields[field]];
      }
      this.props.sendBinaryFileData("POST", "/api/unit/" + this.props.unit.id + "/upload", binaryFormData)
    }
    if (!$.isEmptyObject(data)) {
      this.props.sendApiData("PUT", event.target.action, {data: data})
    }

  }

  //handles image preview BEFORE any image is POST'ed to server/BEFORE any asset_id is generated
  handleImageChange = (event) => {
    event.preventDefault()

    let reader = new FileReader()
    let file = event.target.files[0]
    let imgObj = {}
    let fieldName = event.target.name

    reader.onloadend = () => {
      imgObj[fieldName] = {imagePreviewUrl: reader.result}
      this.setData(imgObj);
    }

    reader.readAsDataURL(file)
  }

  removeImage = (event) => {
    event.preventDefault()
    
    let imgObj = {}
    imgObj[event.target.dataset.input] = {imagePreviewUrl: "http://placehold.it/400x100?text=No+logo"}
    this.setData(imgObj);

    let binaryFormData = new FormData();
    binaryFormData.append(event.target.dataset.input, '')
    this.props.sendBinaryFileData("POST", "/api/unit/" + this.props.unit.id + "/upload", binaryFormData)
  }

  setData = (newStuff) => {
    this.setState({newData: Object.assign(_.cloneDeep(this.state.newData), newStuff)})
  }

  setMarqueeData = (newStuff) => {
    var marquee = Object.assign(_.cloneDeep(this.state.newData.marquee), newStuff)
    this.setData({marquee: marquee})
  }

  renderUnitConfig() {
    let data = this.props.data
    let logoUrl = this.state.newData.logo && this.state.newData.logo.imagePreviewUrl
        ? this.state.newData.logo.imagePreviewUrl
        : data.logo
            ? "/assets/" + data.logo.asset_id
            : "http://placehold.it/400x100?text=No+logo"
    return (
      <Subscriber channel="cms">
      { cms => {
         let disableEdit = !(cms.permissions && cms.permissions.super),
             superCheckboxInstruction = disableEdit ? "" : " (select checkbox to display)"
         return (
         <div>
           <h3>Unit Configuration</h3>
           <div className="c-columns">
             <main>
               <section className="o-columnbox1">
                 <Form to={`/api/unit/${this.props.unit.id}/profileContentConfig`} onSubmit={this.handleSubmit}>
                   <label className="c-editable-page__label" htmlFor="unitName">Name: </label>
                   <input disabled={disableEdit} className="c-editable-page__input" id="unitName" type="text" defaultValue={data.name}
                           onChange={ event => this.setData({ name: event.target.value }) }/>

                   <label className="c-editable-page__label" htmlFor="logoImage">Logo image:</label>
                   <img src={ logoUrl } alt="Logo"/>

                   <input type="file" id="logoImage" name="logo" onChange={this.handleImageChange}/>
                   { this.state.newData.logo && this.state.newData.logo.imagePreviewUrl && <button>Cancel</button> }
                   {/* TODO */}
                   <button onClick={this.removeImage} data-input="logo">Remove File</button>
                   <br/>

                   { this.props.unit.type == 'journal' &&
                     <div>
                       <br/>
                       <label className="c-editable-page__label" htmlFor="doajSeal">DOAJ Seal{superCheckboxInstruction}: </label>
                       { disableEdit ?
                           data.doaj ? <span>Seal displayed</span> : <span>No seal displayed</span>
                           :
                           <input disabled={disableEdit} type="checkbox" id="doajSeal" name="doajSeal" defaultChecked={data.doaj}/>  }
                       <br/><br/>
                       <label className="c-editable-page__label" htmlFor="issn">ISSN: </label>
                       <input disabled={disableEdit} className="c-editable-page__input" id="issn" type="text" defaultValue={data.issn}/>
                       <label className="c-editable-page__label" htmlFor="eissn">E-ISSN: </label>
                       <input disabled={disableEdit} className="c-editable-page__input" id="eissn" type="text" defaultValue={data.eissn}/>
                       <label className="c-editable-page__label" htmlFor="altmetrics_ok">Altmetric&#8482;  data{superCheckboxInstruction}: </label>
                       { disableEdit ?
                           data.altmetrics_ok ? <span>Altmetric data provided in articles</span> : <span>No Altmetric data provided in articles</span>
                           :
                           <input disabled={disableEdit} type="checkbox" id="altmetrics_ok" name="altmetrics_ok" defaultChecked={data.altmetrics_ok}/>  }
                       <br/><br/>
                     </div>
                    }

                   <button type="submit">Save Changes</button>
                 </Form>
               </section>
             </main>
           </div>
         </div>
         )
        }
      }
      </Subscriber>
    )
  }

  renderSocialConfig() {
    let data = this.props.data

    return (
      <div>
        <h3>Social Media Links</h3>
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <div>
                <Form to={`/api/unit/${this.props.unit.id}/profileContentConfig`} onSubmit={this.handleSubmit}>
                  <p>You may provide links to your social media page(s). These will appear as icons in your site's navigation bar.</p>
                  <label className="c-editable-page__label" htmlFor="facebook">Facebook Page Name: </label>
                  <p>The portion of your Facebook page's URL that appears after: http://www.facebook.com/_____</p>
                  <input className="c-editable-page__input" id="facebook" name="facebook" type="text" defaultValue={data.facebook}
                          onChange={ event => this.setData({ facebook: event.target.value }) }/>

                  <label className="c-editable-page__label" htmlFor="twitter">Twitter Username: </label>
                  <p>The portion of your Twitter page's URL that appears after: http://www.twitter.com/_____</p>
                  <input className="c-editable-page__input" id="twitter" name="twitter" type="text" defaultValue={data.twitter}
                          onChange={ event => this.setData({ twitter: event.target.value }) }/>

                  <button type="submit">Save Changes</button> <button type="reset">Cancel</button>
                </Form>
              </div>
            </section>
          </main>
        </div>
      </div>
    )
  }

  renderAboutConfig() {
    var data = this.props.data;
    return (
      <div>
        <h3 id="marquee">About Text</h3>
      {data.marquee.about &&
        <AboutComp about={data.marquee.about} />
      }
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <Form to={`/api/unit/${this.props.unit.id}/profileContentConfig`} onSubmit={this.handleSubmit}>
                <label className="c-editable-page__label" htmlFor="aboutText">About Text</label>
                <p>About text will appear at the top of your site's landing page. It should be fewer than 400 characters in length.</p>
                <textarea className="c-editable-page__input" name="about" id="aboutText" defaultValue={data.marquee.about}
                          onChange={ event => this.setMarqueeData({about: event.target.value}) }/>
                <button type="submit">Save Changes</button> <button type="reset">Cancel</button>
              </Form>
            </section>
          </main>
        </div>
      </div>
    )
  }

  renderDepartmentConfig() {
    let data = this.props.data

    return (
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
    )
  }

  renderJournalConfig() {
    let data = this.props.data

    return (
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
    )
  }

  render() {
    return (
      <div>
        { this.renderUnitConfig() }
        { this.renderSocialConfig() }
        { this.renderAboutConfig() }
        { this.props.unit.type == 'oru' && this.renderDepartmentConfig() }
        { this.props.unit.type == 'journal' && this.renderJournalConfig() }
      </div>
    )
  }
}

module.exports = UnitProfileLayout
