import React from 'react'
import Form from 'react-router-form'
import WysiwygEditorComp from '../components/WysiwygEditorComp.jsx'
import MarqueeComp from '../components/MarqueeComp.jsx'
import PropTypes from 'prop-types'
import _ from 'lodash'

class HeroCarouselLayout extends React.Component {
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
    // console.log("newStuff = ", newStuff)
    this.setState({newData: Object.assign(_.cloneDeep(this.state.newData), newStuff)})
  }

  // ex: newStuff = {header: 'stuff and things'}, i=slide number
  // calls setData with {slides: [{header: , text: , }, {header: , text: ,}]}
  setSlideData = (newStuff, i) => {
   //  console.log("Setting slide data = ", newStuff)
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

  addSlide = () => {
    var slides = _.cloneDeep(this.state.newData.marquee.slides) || []
    slides.push({
      header: 'Sample header',
      text: '<p>sample text</p>',
      image: 'https://static.pexels.com/photos/40797/wild-flowers-flowers-plant-macro-40797.jpeg'
    })
    this.setMarqueeData({slides: slides})
  }

  addSlideHandler = (event) => {
    event.preventDefault()
    this.addSlide()
  }

  //TODO: should go ahead and save current form state before filing this delete off.
  removeSlide = (i) => {
    this.props.sendApiData("DELETE",
      "/api/unit/" + this.props.unit.id + "/removeCarouselSlide/" + i)
  }

  componentWillMount() {
    !this.props.data.marquee.slides && this.addSlide()
  }

  renderSlideConfig(slideData) {
    return slideData.map((slide, i) => {
      return (
        <div style={{padding: "10px", border: "1px solid black"}} key={i}>
          <label className="c-editable-page__label" htmlFor={"header" + i}>Header:</label>
          <input className="c-editable-page__input" id={"header" + i} name={"header" + i} 
                  type="text" defaultValue={slide.header}
                  onChange={ event => this.setSlideData({header: event.target.value}, i) }/>

          <label className="c-editable-page__label" htmlFor={"text" + i}>Text:</label>

          <WysiwygEditorComp className="c-editable-page__input" name={"text" + i} id={"text"+i}
              html={slide.text} unit={this.props.unit.id} onChange={ newText => this.setSlideData({ text: newText }, i) }
              buttons={[
                        ['strong', 'em', 'underline', 'link'], 
                       ]} />

          <label className="c-editable-page__label" htmlFor={"slideImage-" + i}>Image: </label>
          {/*not currently passing the filename back with the slide image*/}
          {/*TODO: remove 'no file chosen' text https://stackoverflow.com/questions/21842274/cross-browser-custom-styling-for-file-upload-button/21842275#21842275 */}

          <div style={{marginBottom: '20px', color: '#555', width: '100%'}}>
            <input type="file" id={"slideImage" + i} name={"slideImage" + i}
                  onChange={ (event) => this.handleSlideImageChange(event, i) }/>
          
        {/* ToDo: Fix. This currently is not doing as expected, but instead actually **Saving the image**
          slide.imagePreviewUrl &&
            <button onClick={ () => this.removeImagePreview(i) }>Cancel Image Upload</button> */}
          </div>
        {/* ToDo: Fix. This currently is not removing the image as expected
          <button>Remove File</button><br/><br/>  */}
          <button disabled={slideData.length == 1} onClick={ () => this.removeSlide(i) }>Remove Slide</button>
        </div>
      )
    })
  }


  render() {
    var data = this.state.newData
    return (
      <div>
        <h3 id="marquee">Landing Page Carousel</h3>
        <MarqueeComp marquee={data.marquee} forceOn={true} />
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <Form to={`/api/unit/${this.props.unit.id}/carouselConfig`} onSubmit={this.handleSubmit}>
                <div className="can-toggle can-toggle--size-small">
                  <input id="displayCarousel" name="carouselFlag" type="checkbox" defaultChecked={data.marquee.carousel}
                         onChange={ event => this.setMarqueeData({carousel: event.target.checked}) }/>
                  <label htmlFor="displayCarousel">
                    <div className="can-toggle__label-text">Publish Carousel</div>
                    <div className="can-toggle__switch" data-checked="Enabled" data-unchecked="Disabled"></div>
                  </label>
                  <div className="c-editable-floatright">
                    <a href="http://help.escholarship.org/support/solutions/articles/9000124100-using-the-site-editing-tool"><img className="c-editable-help__icon" src="/images/icon_help.svg" alt="Get help on landing page carousel" /></a></div>
                  <br/>
                </div>
                <div>
                  {data.marquee.slides && this.renderSlideConfig(data.marquee.slides)}
                  <br/>
                  {<button onClick={ (event) => this.addSlideHandler(event) }>Add slide</button>}
                  <div className="c-editable-floatright">
                    <button type="submit">Save Changes</button>
              {/* ToDo: Turn this back on once this is fixed: 
                  If any images were uploaded, this cancel button isn't refreshing the image back to original
                    <button type="reset">Cancel</button>   */}
                  </div>
                </div>
                <br/><br/>
              </Form>
            </section>
          </main>
        </div>
      </div>
    )
  }

}

class ConfigSettings extends React.Component {
  renderUnitsDropdown() {
    return (
      <select name={"unit_id"+this.props.index}
              defaultValue={this.props.contentCarousel.unit_id}>
      { this.props.campusUnits.map((u) => {
        return (<option key={u.id} value={u.id}>{u.name}</option>)
      })}
      </select>
    )
  }

  render() {
    let p = this.props,
        disabledId = "disabled"+p.index,
        journalsId = "journals"+p.index,
        featuredUnitId = "featuredUnit"+p.index
    return (
      <div>
            <input className="c-editable-page__radio-vertical" type="radio"
                   id={disabledId} name={"mode"+p.index} value="disabled"
                   defaultChecked={p.contentCarousel.mode=="disabled"}/>
            <label className="c-editable-page__radio-label" htmlFor={disabledId}>Disabled</label>
            <br/><br/>
            <input className="c-editable-page__radio-vertical" type="radio"
                   id={journalsId} name={"mode"+p.index} value="journals"
                   defaultChecked={p.contentCarousel.mode=="journals"}/>
            <label className="c-editable-page__radio-label" htmlFor={journalsId}>Campus Journal Covers</label>
            <br/><br/>
            <input className="c-editable-page__radio-vertical" type="radio"
                   id={featuredUnitId} name={"mode"+p.index} value="unit"
                   defaultChecked={p.contentCarousel.mode=="unit"}/>
            <label className="c-editable-page__radio-label" htmlFor={featuredUnitId}>Featured Unit</label>
            {this.renderUnitsDropdown()}
      </div>
    )
  }
}

class CampusCarouselConfig extends React.Component {
  handleSubmit = (event, data) => {
    event.preventDefault()
    this.props.sendApiData("PUT", event.target.action, {data: data})
  }

  render () {
    let data = this.props.data
    return (
      <div>
        <h3 className="c-editable-h3">Content Carousel(s)</h3>
        <div className="c-editable-floatright">
          <a href="http://help.escholarship.org/support/solutions/articles/9000124100-using-the-site-editing-tool"><img className="c-editable-help__icon" src="/images/icon_help.svg" alt="Get help on content carousels" /></a></div>
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <Form to={`/api/unit/${this.props.unit.id}/campusCarouselConfig`} onSubmit={this.handleSubmit}>
                <p>Content carousels may be used to feature content collections on your campus landing pages.</p>
                <div className="c-editable-page__label">Content Carousel 1</div>
                <ConfigSettings unit={this.props.unit} contentCarousel={data.contentCar1} index={1} campusUnits={data.campusUnits} />
                <br /><br />
                <div className="c-editable-page__label">Content Carousel 2</div>
                <ConfigSettings unit={this.props.unit} contentCarousel={data.contentCar2} index={2} campusUnits={data.campusUnits} />
                <br/><br/>
                <button type="submit">Save Changes</button> 
              {/* ToDo: Fix 
                 Right now, this selects no radio buttons, which doesn't make sense
                <button type="reset">Cancel</button>   */}
              </Form>
            </section>
          </main>
        </div>
      </div>
    )
  }
}

class UnitCarouselConfigLayout extends React.Component {
  static propTypes = {
    data:  PropTypes.shape({
      // --- BEGIN --- properties used strictly for Campus Landing page config
      contentCar1: PropTypes.shape({
        mode: PropTypes.string,
        unit_id: PropTypes.string,
      }),
      contentCar2: PropTypes.shape({
        mode: PropTypes.string,
        unit_id: PropTypes.string,
      }),
      campusUnits: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
      })),
      // --- END --- properties used strictly for Campus Landing page config

      marquee: PropTypes.shape({
        about: PropTypes.string,
        carousel: PropTypes.bool,
//      slides: PropTypes.arrayOf(PropTypes.shape({
//        header: PropTypes.string,
//        image: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
//        text: PropTypes.string,
//        imagePreviewUrl: PropTypes.string
//      }))
      }),
    }),
    unit: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
    }).isRequired,
    sendApiData: PropTypes.any,
    sendBinaryFileData: PropTypes.any,
  }

  render () {
    let data = this.props.data
    return (
      <div>
      { this.props.unit.type != 'campus' && 
        <HeroCarouselLayout {...this.props} /> }
      { this.props.unit.type == 'campus' && (data.contentCar1 || data.contentCar2) &&
        <CampusCarouselConfig data={data} unit={this.props.unit} sendApiData={this.props.sendApiData} /> }
      </div>
    )
  }
}

module.exports = UnitCarouselConfigLayout
