import React from 'react'
import { Link } from 'react-router'
import Form from 'react-router-form'
import { Subscriber } from 'react-broadcast'

import MarqueeComp from '../components/MarqueeComp.jsx'

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

  // ex: newStuff = {header: 'stuff and things'}, i=slide number
  // calls setMarqueeData with {slides: [{header: , text: , }, {header: , text: ,}]}
  setSlideData = (newStuff, i) => {
    var slides = this.state.newData.marquee.slides
    slides[i] = Object.assign(_.cloneDeep(slides[i]), newStuff)

    this.setMarqueeData({slides: slides})
  }

  removeImagePreview = (i) => {
    var slides = _.cloneDeep(this.state.newData.marquee.slides)
    delete slides[i].imagePreviewUrl

    document.getElementById("slideImage").value = ""

    this.setMarqueeData({slides: slides})
  }

  handleSlideImageChange = (event, i) => {
    event.preventDefault()

    let reader = new FileReader()
    let file = event.target.files[0]

    reader.onloadend = () => {
      this.setSlideData({imagePreviewUrl: reader.result}, i);
    }

    reader.readAsDataURL(file)
  }

  setMarqueeData = (newStuff) => {
    var marquee = Object.assign(_.cloneDeep(this.state.newData.marquee), newStuff)
    this.setData({marquee: marquee})
  }

  addSlide = (event) => {
    event.preventDefault()
    var slides = _.cloneDeep(this.state.newData.marquee.slides) || []
    slides.push({
      header: 'Sample header',
      text: 'sample text',
      image: 'https://static.pexels.com/photos/40797/wild-flowers-flowers-plant-macro-40797.jpeg'
    })
    this.setMarqueeData({slides: slides})
  }

  //TODO: should go ahead and save current form state before filing this delete off.
  removeSlide = (i) => {
    this.props.sendApiData("DELETE",
      "/api/unit/" + this.props.unit.id + "/removeCarouselSlide/" + i)
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
         let disableEdit = !(cms.permissions && cms.permissions.super)
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
                       <label className="c-editable-page__label" htmlFor="doajSeal">DOAJ Seal (select checkbox to display): </label>
                       { disableEdit ?
                           data.doaj ? <span>Seal displayed</span> : <span>No seal displayed</span>
                           :
                           <input disabled={disableEdit} type="checkbox" id="doajSeal" name="doajSeal" defaultChecked={data.doaj}/>  }
                       <br/><br/>
                       <label className="c-editable-page__label" htmlFor="issn">ISSN: </label>
                       <input disabled={disableEdit} className="c-editable-page__input" id="issn" type="text" defaultValue={data.issn}/>
                       <label className="c-editable-page__label" htmlFor="eissn">E-ISSN: </label>
                       <input disabled={disableEdit} className="c-editable-page__input" id="eissn" type="text" defaultValue={data.eissn}/>
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

  renderSlideConfig() {
    var slideData = this.state.newData.marquee.slides;
    return slideData.map((slide, i) => {
      return (
        <div style={{padding: "10px", border: "1px solid black"}} key={i}>
          <label className="c-editable-page__label" htmlFor={"header-" + i}>Header:</label>
          <input className="c-editable-page__input" id={"header-" + i} name={"header" + i} 
                  type="text" defaultValue={slide.header}
                  onChange={ event => this.setSlideData({header: event.target.value}, i) }/>

          <label className="c-editable-page__label" htmlFor={"text-" + i}>Text:</label>
          <textarea className="c-editable-page__input" id={"text-" + i} name={"text" + i} 
                  defaultValue={slide.text}
                  onChange={ event => this.setSlideData({text: event.target.value}, i) }/>

                  <label className="c-editable-page__label" htmlFor={"slideImage-" + i}>Image: </label>
          {/*not currently passing the filename back with the slide image*/}
          {/*TODO: remove 'no file chosen' text https://stackoverflow.com/questions/21842274/cross-browser-custom-styling-for-file-upload-button/21842275#21842275 */}

          <div style={{marginBottom: '20px', color: '#555', width: '100%'}}>
            <input type="file" id={"slideImage" + i} name={"slideImage" + i}
                  onChange={ (event) => this.handleSlideImageChange(event, i) }/>
            {slide.imagePreviewUrl && <button onClick={ () => this.removeImagePreview(i) }>Cancel Image Upload</button>}
          </div>
          {/* TODO */}
          <button>Remove File</button>
          <button onClick={ () => this.removeSlide(i) }>Remove Slide</button>
        </div>
      )
    })
  }

  renderMarqueeConfig() {
    var data = this.state.newData;

    return (
      <div>
        <h3 id="marquee">Marquee Configuration</h3>
        <MarqueeComp marquee={data.marquee} unit={this.props.unit}/>
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <Form to={`/api/unit/${this.props.unit.id}/profileContentConfig`} onSubmit={this.handleSubmit}>
                <label className="c-editable-page__label" htmlFor="aboutText">About Text</label>
                <p>About text will appear at the top of your site's landing page. It should be fewer than 400 characters in length.</p>
                <textarea className="c-editable-page__input" name="about" id="aboutText" defaultValue={data.marquee.about}
                          onChange={ event => this.setMarqueeData({about: event.target.value}) }/>
              {["oru", "journal"].includes(this.props.unit.type) &&
                <div>
                  {!data.marquee.slides && <button onClick={ event => this.addSlide(event) }>Add an image carousel</button>}
                  {data.marquee.slides && this.renderSlideConfig() }<br/>
                  {data.marquee.slides && <button onClick={ (event) => this.addSlide(event) }>Add slide</button>}

                  <label className="c-editable-page__label" htmlFor="displayCarousel">Publish Carousel?
                  <input name="carouselFlag" id="displayCarousel" type="checkbox" defaultChecked={data.marquee.carousel}
                         onChange={ event => this.setMarqueeData({carousel: event.target.checked}) }/>
                  </label>
                </div>
              }

                <button type="submit">Save Changes</button> <button type="reset">Cancel</button>
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
        { this.renderMarqueeConfig() }
        { this.props.unit.type == 'oru' && this.renderDepartmentConfig() }
        { this.props.unit.type == 'journal' && this.renderJournalConfig() }
      </div>
    )
  }
}

module.exports = UnitProfileLayout
