import React from 'react'
import BackgroundColorPickerComp from '../components/BackgroundColorPickerComp.jsx'
import ElementColorPickerComp from '../components/ElementColorPickerComp.jsx'
import CheckContrastComp from '../components/CheckContrastComp.jsx'
import SubheaderComp from '../components/SubheaderComp.jsx'
import WysiwygEditorComp from '../components/WysiwygEditorComp.jsx'
import Contexts from '../contexts.jsx'
import FormComp from '../components/FormComp.jsx'
import _ from 'lodash'

class UnitProfileLayout extends React.Component {
  // static propTypes = {
  // }

  state = { newData: this.props.data,
            banner_flag_visible: this.props.data.logo  }

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
      this.setData(imgObj)
    }

    reader.readAsDataURL(file)
    this.setState({banner_flag_visible: true})
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
    let heroUrl = this.state.newData.hero && this.state.newData.hero.imagePreviewUrl
        ? this.state.newData.hero.imagePreviewUrl
        : data.hero
            ? "/assets/" + data.hero.asset_id
            : "http://placehold.it/500x200?text=No+hero+image"
    return (
      <Contexts.CMS.Consumer>
      { cms => {
         let disableEdit = !(cms.permissions && cms.permissions.super)
         let disableLogo = (this.props.unit.type.indexOf("series") >= 0) ||
                           (this.props.unit.type == "campus" && disableEdit)
        //  console.log(this.props);
         let [bgColor, setBgColor] = [this.state.newData.bgColor || data.bgColor, (color)=>{this.setData({bgColor:color})}]
         let [elColor, setElColor] = [this.state.newData.elColor || data.elColor, (color)=>{this.setData({elColor:color})}]
         let bgColorToCheck = bgColor.replace('#', '')
         let elColorToCheck = elColor === 'black' ? '000000' : 'ffffff'
         return (
         <div>
           <h3>Unit Configuration</h3>
           <div className="c-columns">
             <main>
               <section className="o-columnbox1">
                 <FormComp to={`/api/unit/${this.props.unit.id}/profileContentConfig`} onSubmit={this.handleSubmit}>
                   {/* Marker so that unitPages.rb can tell which section is being submitted */}
                   <input type="hidden" name="unitConfigSection" defaultValue="yes"/>
                   <label className="c-editable-page__label" htmlFor="unitName">Name: {disableEdit ? "(restricted)" : ""}</label>
                   <input disabled={disableEdit} className="c-editable-page__input" id="unitName" type="text" defaultValue={data.name}
                           onChange={ event => this.setData({ name: event.target.value }) }/>

                   <label className="c-editable-page__label" htmlFor="logoImage">Logo image{disableLogo ? "(restricted)" : ""}</label>
                   <img src={ logoUrl } alt="Logo"/>
                   <br/>
                   { !disableLogo &&
                     <div>
                       <input type="file" id="logoImage" name="logo" onChange={this.handleImageChange}/>
                       <br/><br/>
                    { this.state.banner_flag_visible &&
                      [<label key="0" className="c-editable-page__label" htmlFor="logoIsBanner">Suppress typeset site name next to logo: </label>,
                       <p key="1">Check the box below if your logo image contains the full, legible title of your site.</p>,
                       <input key="2" type="checkbox" id="logoIsBanner" name="logoIsBanner"
                              defaultChecked={data.logo && data.logo.is_banner}/>] }

                      { this.props.unit.type == 'campus' &&
                       <div>
                         <hr/>
                         <br/><br/>
                         <label className="c-editable-page__label" htmlFor="heroImage">Hero image{disableLogo ? "(restricted)" : ""}</label>
                         <img src={ heroUrl } alt="Hero Image"/>
                         <input type="file" id="heroImage" name="hero" onChange={this.handleImageChange}/>
                         <br/><br/>
                       </div>
                      }
                     </div>
                   }
                   <br/>

                   { cms.permissions && cms.permissions.super && !disableLogo &&
                    <div className="c-subheadercontrols">
                      <h1>Subheader Color Controls</h1>
                      <BackgroundColorPickerComp textLabel="Subheader Background Color" backgroundColor={bgColor} onBackgroundColorChange={setBgColor} />
                      <ElementColorPickerComp fieldsetLabel="Subheader Element Color" onElementColorChange={setElColor} isDefault={elColor} />
                      <CheckContrastComp checkForeground={elColorToCheck} checkBackground={bgColorToCheck} />
                      <h2>Sample Banner</h2>
                      {/* FIXME: use actual values for this sample, from this.props.unit etc. */} 
                      {/* <SubheaderComp unit={this.props.unit} backgroundColor={bgColor} elementColor={elColor} bannerLink={'https://escholarship.org/uc/bling_formal_linguistics'} unitTitle={'Lorem Ipsum Consectetur Adipisicing Elit'} isWide={false} campusLabel={'UC Berkeley'} campusLink={'https://escholarship.org/uc/ucb'} /> */}
                    </div>
                   }

                   { cms.permissions && cms.permissions.super &&
                     <div>
                       <label className="c-editable-page__label" htmlFor="status">Unit status: </label>
                       <select name="status" defaultValue={data.status}>
                         <option value="active">Active</option>
                         <option value="hidden">Hidden</option>
                         <option value="archived">Archived</option>
                       </select>
                       <br/><br/>
                       <label className="c-editable-page__label" htmlFor="directSubmit">Direct submit: </label>
                       <select name="directSubmit" defaultValue={data.directSubmit}>
                         <option value="enabled">Enabled</option>
                         <option value="disabled">Disabled</option>
                         <option value="moribund">Archived</option>
                       </select>
                       <br/><br/>
                       <label className="c-editable-page__label" htmlFor="directSubmitURL">Direct submit URL (for external submission management): </label>
                       <input disabled={disableEdit} className="c-editable-page__input" id="directSubmitURL" type="text" defaultValue={data.directSubmitURL}
                           onChange={ event => this.setData({ directSubmitURL: event.target.value }) }/>
                       {this.props.unit.type.indexOf("series") >= 0 &&
                         <div>
                           <label className="c-editable-page__label" htmlFor="elementsID">Elements numeric group ID (for secondary association on deposit): </label>
                           <input disabled={disableEdit} className="c-editable-page__input" id="elementsID" type="text" defaultValue={data.elementsID}
                               onChange={ event => this.setData({ elementsID: event.target.value }) }/>
                          </div>
                        }
                     </div>
                   }

                   { this.props.unit.type == 'journal' &&
                     <div>
                       <br/>
                       { disableEdit ?
                         <div><div>DOAJ Seal (restricted):</div>
                              <span>{data.doaj ? "Seal displayed" : "No seal displayed"}</span></div>
                         :
                         <div><label className="c-editable-page__label" htmlFor="doajSeal">DOAJ Seal: </label>
                              <input disabled={disableEdit} type="checkbox" id="doajSeal" name="doajSeal" defaultChecked={data.doaj}/></div>
                       }
                       <br/>
                       <label className="c-editable-page__label" htmlFor="issn">ISSN: </label>
                       <input disabled={disableEdit} className="c-editable-page__input" id="issn" type="text" defaultValue={data.issn}/>
                       <label className="c-editable-page__label" htmlFor="eissn">E-ISSN: </label>
                       <input disabled={disableEdit} className="c-editable-page__input" id="eissn" type="text" defaultValue={data.eissn}/>
                       { disableEdit ?
                         <div><div>Altmetric&#8482; (restricted):</div>
                              <span id="altmetrics_ok">{data.altmetrics_ok ? "Altmetric data provided in articles" : "No Altmetric data provided in articles"}</span></div>
                         :
                         <div><label className="c-editable-page__label" htmlFor="altmetrics_ok">Altmetric&#8482;: </label>
                              <input disabled={disableEdit} type="checkbox" id="altmetrics_ok" name="altmetrics_ok" defaultChecked={data.altmetrics_ok}/></div>
                       }
                       <br/>
                     </div>
                    }

                    { /series|journal/.test(this.props.unit.type) &&
                      <div>
                        { disableEdit ?
                          <div>
                            <div>Commenting enabled in hypothes.is (restricted): </div>
                            <span>{data.commenting_ok ? "Yes" : "No"}</span>
                          </div>
                          :
                          <div>
                            <label className="c-editable-page__label" htmlFor="commenting_ok">Commenting enabled in hypothes.is: </label>
                            <input type="checkbox" id="commenting_ok" name="commenting_ok" defaultChecked={data.commenting_ok}/>
                          </div>
                        }
                        <br/>
                      </div>
                    }

                   <button type="submit">Save Changes</button>
                 </FormComp>
               </section>
             </main>
           </div>
         </div>
         )
        }
      }
      </Contexts.CMS.Consumer>
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
                <FormComp to={`/api/unit/${this.props.unit.id}/profileContentConfig`} onSubmit={this.handleSubmit}>
                  <p>You may provide links to your social media page(s). These will appear as icons in your site's navigation bar.</p>
                  <label className="c-editable-page__label" htmlFor="facebook">Facebook Page Name: </label>
                  <p>The portion of your Facebook page's URL that appears after: http://www.facebook.com/_____</p>
                  <input className="c-editable-page__input" id="facebook" name="facebook" type="text" defaultValue={data.facebook}
                          onChange={ event => this.setData({ facebook: event.target.value }) }/>

                  <label className="c-editable-page__label" htmlFor="twitter">Twitter Username: </label>
                  <p>The portion of your Twitter page's URL that appears after: http://www.twitter.com/_____</p>
                  <input className="c-editable-page__input" id="twitter" name="twitter" type="text" defaultValue={data.twitter}
                          onChange={ event => this.setData({ twitter: event.target.value }) }/>

                  <button type="submit">Save Changes</button>
                {/* Not using this right now
                  <button type="reset">Cancel</button>   */}
                </FormComp>
              </div>
            </section>
          </main>
        </div>
      </div>
    )
  }

  renderAboutConfig() {
    let data = this.state.newData
    let aboutText = data.marquee.about ? data.marquee.about : ""
    return (
      <div>
        <h3 id="marquee">About Text</h3>
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <FormComp to={`/api/unit/${this.props.unit.id}/profileContentConfig`} onSubmit={this.handleSubmit}>
                <label className="c-editable-page__label" htmlFor="aboutText">About Text</label>
                <p>About text will appear at the top of your site's landing page. It should be fewer than 400 characters in length.</p>
                <WysiwygEditorComp className="c-editable-page__input" name="about" id="about"
                    html={aboutText} unit={this.props.unit.id}
                    onChange={ newText => this.setMarqueeData({about: newText}) }
                    buttons={[
                              ['strong', 'em', 'underline', 'link', 'superscript', 'subscript'], 
                             ]} />
                <button type="submit">Save Changes</button>
              {/* Not using this right now
                <button type="reset">Cancel</button>  */}
              </FormComp>
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
              <FormComp to={`/api/unit/${this.props.unit.id}/profileContentConfig`} onSubmit={this.handleSubmit}>
                <input type="hidden" name="journalConfigSection" defaultValue="yes"/>
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
                <button>Save Changes</button>
              {/* Not using this right now
                <button>Cancel</button> */}
              </FormComp>
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
        { this.props.unit.type == 'journal' && this.renderJournalConfig() }
      </div>
    )
  }
}

export default UnitProfileLayout
