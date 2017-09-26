import React from 'react'
import Form from 'react-router-form'
import WysiwygEditorComp from '../components/WysiwygEditorComp.jsx'
import MarqueeComp from '../components/MarqueeComp.jsx'

class UnitCarouselConfigLayout extends React.Component {
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
  // calls setData with {slides: [{header: , text: , }, {header: , text: ,}]}
  setSlideData = (newStuff, i) => {
    console.log(newStuff)
    var slides = this.state.newData.slides
    slides[i] = Object.assign(_.cloneDeep(slides[i]), newStuff)

    this.setData({slides: slides})
  }

  removeImagePreview = (i) => {
    var slides = _.cloneDeep(this.state.newData.slides)
    delete slides[i].imagePreviewUrl

    document.getElementById("slideImage").value = ""

    this.setData({slides: slides})
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

  addSlide = () => {
    var slides = _.cloneDeep(this.state.newData.slides) || []
    slides.push({
      header: 'Sample header',
      text: '<div>sample text</div>',
      image: 'https://static.pexels.com/photos/40797/wild-flowers-flowers-plant-macro-40797.jpeg'
    })
    this.setData({slides: slides})
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
    !this.state.newData.slides && this.addSlide()
  }

  renderSlideConfig() {
    var slideData = this.state.newData.slides
    return slideData.map((slide, i) => {
      return (
        <div style={{padding: "10px", border: "1px solid black"}} key={i}>
          <label className="c-editable-page__label" htmlFor={"header-" + i}>Header:</label>
          <input className="c-editable-page__input" id={"header-" + i} name={"header" + i} 
                  type="text" defaultValue={slide.header}
                  onChange={ event => this.setSlideData({header: event.target.value}, i) }/>

          <label className="c-editable-page__label" htmlFor={"text-" + i}>Text:</label>

          <WysiwygEditorComp className="c-editable-page__input" name={"text-" + i} id={"text-" + i} 
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
            {slide.imagePreviewUrl && <button onClick={ () => this.removeImagePreview(i) }>Cancel Image Upload</button>}
          </div>
          {/* TODO */}
          <button>Remove File</button>
          <button onClick={ () => this.removeSlide(i) }>Remove Slide</button>
        </div>
      )
    })
  }

  render() {
    var data = this.state.newData
    return (
      <div>
        <h3 id="marquee">Landing Page Carousel</h3>
      {(data.carousel || data.about) &&
        <MarqueeComp marquee={data} />
      }
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <Form to={`/api/unit/${this.props.unit.id}/profileContentConfig`} onSubmit={this.handleSubmit}>
                <div className="can-toggle can-toggle--size-small">
                  <input id="displayCarousel" name="carouselFlag" type="checkbox" defaultChecked={data.carousel}
                         onChange={ event => this.setData({carousel: event.target.checked}) }/>
                  <label htmlFor="displayCarousel">
                    <div className="can-toggle__label-text">Publish Carousel</div>
                    <div className="can-toggle__switch" data-checked="Enabled" data-unchecked="Disabled"></div>
                  </label>
                  <br/>
                </div>
                <div>
                  {this.renderSlideConfig()}<br/>
                  {<button onClick={ (event) => this.addSlideHandler(event) }>Add slide</button>}
                </div>
                <button type="submit">Save Changes</button> <button type="reset">Cancel</button>
              </Form>
            </section>
          </main>
        </div>
      </div>
    )
  }

}

module.exports = UnitCarouselConfigLayout
