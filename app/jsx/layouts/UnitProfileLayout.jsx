import React from 'react'
import BackgroundColorPickerComp from '../components/BackgroundColorPickerComp.jsx'
import ElementColorPickerComp from '../components/ElementColorPickerComp.jsx'
import CheckContrastComp from '../components/CheckContrastComp.jsx'
import SubheaderComp from '../components/SubheaderComp.jsx'
import WysiwygEditorComp from '../components/WysiwygEditorComp.jsx'
import Contexts from '../contexts.jsx'
import FormComp from '../components/FormComp.jsx'
import _ from 'lodash'
import Datetime from 'react-datetime'
import Select from 'react-select'


export const contentOptions = [
    { value: "faculty", label: "Faculty" },
    { value: "researcher", label: "Researchers" },
    { value: "grad", label: "Graduate Students" },
    { value: "undergrad", label: "Undergraduate Students" },
    { value: "practitioner", label: "Practitioners" },

];

export const indexOptions = [
    { value: "clarivate", label: "Clarivate" },
    { value: "doaj", label: "DOAJ" },
    { value: "ebsco", label: "EBSCO" },
    { value: "pubmed", label: "PubMed" },
    { value: "road", label: "ROAD" },
    { value: "scopus", label: "SCOPUS" },
    { value: "jstor", label: "JSTOR" },

];

export const disciplineOptions = [
    { value: "arch", label: "Architecture" },
    { value: "art", label: "Arts and Humanities" },
    { value: "bus", label: "Business" },
    { value: "edu", label: "Education" },
    { value: "eng", label: "Engineering" },
    { value: "law", label: "Law" },
    { value: "life", label: "Life Sciences" },
    { value: "medicine", label: "Medicine and Health Sciences" },
    { value: "physical", label: "Physical Sciences and Mathematics" },
    { value: "social", label: "Social and Behavioral Sciences" }
];

const MAX_LOGO_WIDTH = 800
const MAX_LOGO_HEIGHT = 90

const acceptedDimensions = {
  logo: {
    width: 800,
    height: 90
  },
  hero: {
    width: 1000,
    height: 400
  }
}

class UnitProfileLayout extends React.Component {
  // static propTypes = {
  // }

  state = { newData: this.props.data,
            banner_flag_visible: this.props.data.logo,
	    tos:this.props.data.tos,
            indexed:"indexed" in this.props.data ? indexOptions.filter(p=>this.props.data["indexed"].includes(p.value)):"",
            disciplines:"disciplines" in this.props.data ? disciplineOptions.filter(p=>this.props.data["disciplines"].includes(p.value)):"",
            contentby:"contentby" in this.props.data ? contentOptions.filter(p=>this.props.data["contentby"].includes(p.value)):"",
          };

  updatetos = value => {
	  this.setState({ tos: value });
  };
  updateIndexed = value => {
	  this.setState({ indexed: value });
  };
  updateDisciplines = value => {
	  this.setState({ disciplines: value });
  };
  updateContentby = value => {
	  this.setState({ contentby: value });
  };

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

    // add tos datetime value from state
    if (this.state.tos instanceof Object) {	  
       data.tos = this.state.tos.format('L')
    }

    if (!$.isEmptyObject(data)) {
      this.props.sendApiData("PUT", event.target.action, {data: data})
    }

  }

  //handles image preview BEFORE any image is POST'ed to server/BEFORE any asset_id is generated
  // TODO: 
  // - accepted dimensions are different for logo and hero -- accomodate both
  handleImageChange = (event) => {
    event.persist() // keep the event from being nullified 
    event.preventDefault()
    let reader = new FileReader()
    let file = event.target.files[0]
    let imgObj = {}
    let fieldName = event.target.name
    const acceptedWidth = acceptedDimensions[fieldName].width
    const acceptedHeight = acceptedDimensions[fieldName].height

    reader.onloadend = () => {
      // https://stackoverflow.com/a/58897088
      let img = new Image()
      img.src = reader.result

      img.onload = () => {
        const { width, height } = img
        console.log(width, height)

        if (width > acceptedWidth || height > acceptedHeight) {
          alert(`Error: ${width}x${height} exceeds maximum allowed dimensions of ${acceptedWidth}x${acceptedHeight}`) // should use ModalComp here
          event.target.value = "" // reset the filename text
          return
        }

        imgObj[fieldName] = { imagePreviewUrl: reader.result }
        this.setData(imgObj)
        this.setState({ banner_flag_visible: true })
      }
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
            ? "/cms-assets/" + data.logo.asset_id
            : "http://placehold.it/400x100?text=No+logo"
    let heroUrl = this.state.newData.hero && this.state.newData.hero.imagePreviewUrl
        ? this.state.newData.hero.imagePreviewUrl
        : data.hero
            ? "/cms-assets/" + data.hero.asset_id
            : "http://placehold.it/500x200?text=No+hero+image"
    return (
      <Contexts.CMS.Consumer>
      { cms => {
         let disableEdit = !(cms.permissions && cms.permissions.super)
         
         let disableLogo = (this.props.unit.type.indexOf("series") >= 0) ||
                           (this.props.unit.type == "campus" && disableEdit)
         let newHeader = Object.assign({}, this.props.header)
         let [bgColor, setBgColor] = [this.state.newData.bgColor || data.bgColor, (color)=>{this.setData({bgColor:color})}]
         let [elColor, setElColor] = [this.state.newData.elColor || data.elColor, (color)=>{this.setData({elColor:color})}]
         let bgColorToCheck = bgColor.replace('#', '')
         let elColorToCheck = elColor === 'black' ? '000000' : 'ffffff'
         newHeader['bgColor'] = bgColor
         newHeader['elColor'] = elColor
         
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
                       <i>Logo requirements: 800px width x 90px height in JPG, PNG, or GIF format. 
                        <a href="https://help.escholarship.org/support/solutions/articles/9000124100">
                          See the eScholarship help center for more information.
                        </a>
                       </i>
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
                      <SubheaderComp unit={this.props.unit} header={newHeader} />
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
                       <label className="c-editable-page__label" htmlFor="directManageURLauthor">Direct manage URL for Authors (for external submission management): </label>
                       <input disabled={disableEdit} className="c-editable-page__input" id="directManageURLauthor" type="text" defaultValue={data.directManageURLauthor}
                           onChange={ event => this.setData({ directManageURLauthor: event.target.value }) }/>
                       <label className="c-editable-page__label" htmlFor="directManageURLeditor">Direct manage URL for Editors (for external submission management): </label>
                       <input disabled={disableEdit} className="c-editable-page__input" id="directManageURLeditor" type="text" defaultValue={data.directManageURLeditor}
                           onChange={ event => this.setData({ directManageURLeditor: event.target.value }) }/>
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
                       <div><label className="c-editable-page__label" htmlFor="indexed">Indexed by: </label>  
	        	    <Select name="indexed" value={this.state.indexed} options = {indexOptions} onChange={this.updateIndexed} isMulti={true} />
                       </div>
	               <br/>
                       <div>
                          <label className="c-editable-page__label" htmlFor="tos">eScholarship TOS Version on File: </label>
	                  <Datetime id="tos" name="tos" timeFormat={false} value={this.state.tos} onChange={this.updatetos}/>
		          <br/>
                       </div>
                       <div>
                          <label className="c-editable-page__label" htmlFor="disciplines">Relevant Discipline(s): </label>
		          <Select name="disciplines" value={this.state.disciplines} options = {disciplineOptions} onChange={this.updateDisciplines} isMulti={true} />
                       </div>
	               <br/>
                       <div>
                          <label className="c-editable-page__label" htmlFor="pub_freq">Target publication frequency: </label>
                          <select name="pub_freq" defaultValue={data.pub_freq}>
                              <option value="incremental">Incremental</option>
                              <option value="fortnightly">Fortnightly</option>
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                              <option value="yearly">Yearly</option>
                              <option value="twoyearly">2-years</option>
                         </select>
                      </div>
	              <br/>			   
                      <div>
                         <label className="c-editable-page__label" htmlFor="oaspa">OASPA Status: </label>
                         <select name="oaspa" defaultValue={data.oaspa}>
                            <option value="notSubmitted">Not Submitted</option>
                            <option value="submitted">Submitted</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                         </select>
                      </div>
	              <br/>
                      <div>
                         <label className="c-editable-page__label" htmlFor="apc">APC Amount: </label>
                         <input className="c-editable-page__input" id="apc" type="text" defaultValue={data.apc} />
                      </div>
                      <div>
                         <label className="c-editable-page__label" htmlFor="contentby">Journal content primarily by: </label>
		         <Select name="contentby" value={this.state.contentby} options = {contentOptions} onChange={this.updateContentby} isMulti={true} />
                      </div>
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
