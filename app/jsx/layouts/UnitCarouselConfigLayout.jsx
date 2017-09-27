import React from 'react'
import Form from 'react-router-form'
import WysiwygEditorComp from '../components/WysiwygEditorComp.jsx'
import MarqueeComp from '../components/MarqueeComp.jsx'
import PropTypes from 'prop-types'

class UnitCarouselConfigLayout extends React.Component {
  static propTypes = {
    campusUnits: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    })
//      slides: PropTypes.arrayOf(PropTypes.shape({
//        header: PropTypes.string,
//        image: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
//        text: PropTypes.string,
//        imagePreviewUrl: PropTypes.string
//      }))

  }

  state = { newData: this.props.data }

  handleSubmit = (event, data) => {
    console.log(data)
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
    // console.log(newStuff)
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
    // !this.state.newData.slides && this.addSlide()
  }

  renderSlideConfig() {
    // console.log(this.state)
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
              id={"react-trumboiwyg" + i}
              html="<p>sample text</p>" unit={this.props.unit.id} onChange={ newText => this.setSlideData({ text: newText }, i) }
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

  renderUnitsDropdown() {
    return (
      <select name="units"
              value="none">
        <option value="none">None</option>
        <option value="xyz">The Berkeley Institute of the Environment</option>
        <option value="aby">Bay Area International Group</option>
        <option value="bbg">Bixby Center for Population, Health & Sustainability</option>
        <option value="citris">Center for Information Technology Research in the Interest of Society (CITRIS)</option>
        <option value="clcs">Center for the Study of Law and Society Jurisprudence and Social Policy Program</option>
      </select>
    )
  }

  render() {
    var data = this.state.newData
    // console.log(data)
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
                  {data.slides && data.slides.length > 0 ? this.renderSlideConfig() : null}
                  <br/>
                  {<button onClick={ (event) => this.addSlideHandler(event) }>Add slide</button>}
                </div>
                <button type="submit">Save Changes</button> <button type="reset">Cancel</button>
              </Form>
            </section>
          </main>
        </div>
      { this.props.unit.type == 'campus' &&
        <div>
          <h3>Content Carousel(s)</h3>
          <div className="c-columns">
            <main>
              <section className="o-columnbox1">
                <p>Content carousels may be used to feature content collections on your campus landing pages.</p>
                {/* <Form to={`/api/unit/${this.props.unit.id}/campusCarouselConfig`} onSubmit={this.handleSubmit}>
                  <div className="c-editable-page__label">Content Carousel 1</div>
                  <table className="c-issueTable"><thead></thead>
                    <tbody><tr>
                      <td>
                  <input className="c-editable-page__radio" type="radio"
                         id="cc_1_disabled" name="campus_carousel_1" value="disabled"
                         defaultChecked={data.campus_carousel_1=="disabled"}/>
                  <label className="c-editable-page__radio-label" htmlFor="cc_1_disabled">Disabled</label>
                      </td>
                      <td>
                  <input className="c-editable-page__radio" type="radio"
                         id="cc_1_journals" name="campus_carousel_1" value="journals"
                         defaultChecked={data.campus_carousel_1=="journals"}/>
                  <label className="c-editable-page__radio-label" htmlFor="cc_1_journals">Campus Journal Covers</label>
                      </td>
                      <td>
                  <input className="c-editable-page__radio" type="radio"
                         id="cc_1_unit" name="campus_carousel_1" value="unit"
                         defaultChecked={data.campus_carousel_1=="unit"}/>
                  <label className="c-editable-page__radio-label" htmlFor="cc_1_unit">Featured Unit</label>
                  {this.renderUnitsDropdown()}
                      </td>
                      </tr>
                    </tbody>
                  </table>
                  <br /><br />

                  <div className="c-editable-page__label">Content Carousel 2</div>
                  <input className="c-editable-page__radio" type="radio"
                         id="cc_2_disabled" name="campus_carousel_2" value="disabled"
                         defaultChecked={data.campus_carousel_2=="disabled"}/>
                  <label className="c-editable-page__radio-label" htmlFor="cc_2_disabled">Disabled</label>
                  <input className="c-editable-page__radio" type="radio"
                         id="cc_2_journals" name="campus_carousel_2" value="journals"
                         defaultChecked={data.campus_carousel_2=="journals"}/>
                  <label className="c-editable-page__radio-label" htmlFor="cc_2_journals">Campus Journal Covers</label>
                  <input className="c-editable-page__radio" type="radio"
                         id="cc_2_unit" name="campus_carousel_2" value="unit"
                         defaultChecked={data.campus_carousel_2=="unit"}/>
                  <label className="c-editable-page__radio-label" htmlFor="cc_2_unit">Featured Unit</label>
                  {this.renderUnitsDropdown()}
                  <br /><br />

                  <button type="submit">Save Changes</button> <button type="reset">Cancel</button>
                </Form> */}
              </section>
            </main>
          </div>
        </div>
      }
      </div>
    )
  }

}

module.exports = UnitCarouselConfigLayout
