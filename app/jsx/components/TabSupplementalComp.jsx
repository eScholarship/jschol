// ##### Tab Supplemental Material Component ##### //

import React from 'react'
import MediaFileGridComp from '../components/MediaFileGridComp.jsx'

class RefineComp extends React.Component {
  render() {
    let mimeSimpleLabel = { 'audio':'Audio', 'data':'Others', 'doc':'Documents', 'image':'Images', 'video':'Videos' }
    return (
      <div className="c-itemactions">
      {(this.props.mimeTypes.length > 1) && 
        <div className="o-input__droplist2">
          <label htmlFor="o-input__droplist-label2">Refine media type by:</label>
          <select name="filterType" id="o-input__droplist-label2" onChange={this.props.changeType} value={this.props.filterType}>
            <option value="">All</option>
          { this.props.mimeTypes.map((type) => {
            return (<option key={type} value={type}>{mimeSimpleLabel[type]}</option>)
          })}
          </select>
        </div>
      }
        <div className="o-download">
        {(this.props.mimeTypes.length > 1) ? 
          [<button key="0" className="o-download__button">Download All Files</button>,
           <details key="1" className="o-download__formats">
             <summary aria-label="formats"></summary>
             <ul className="o-download__single-menu">
               <li><a href="">Image</a></li>
               <li><a href="">Audio</a></li>
               <li><a href="">Video</a></li>
               <li><a href="">Zip</a></li>
               <li><a href="">File</a></li>
             </ul>
           </details>]
         :
           <button className="o-button__8">Download All Files</button>
        }
        </div>
      </div>
    ) 
  }
}

class TabSupplementalComp extends React.Component {
  state = {filterType: ""}

  changeType = event => {
    this.setState({filterType: event.target.value})
  }

  render() {
    let supp_files_orig = this.props.attrs.supp_files,
        supp_files = [],
        mimeTypes = [] 
    if (supp_files_orig) {  
      // mimeSimple = Normalized mimeType value to make filtering files easier
      for (let f of supp_files_orig) {
        var mimeSimple = ""
        var s = f.mimeType.split('/')
        if ((s[0] == "text") ||
            (s[0] == "application" && ["pdf", "msword", "postscript", "wordperfect", "pdf"].includes(s[1]))) {
          mimeSimple = "doc"
        }
        else if ((s[0] == "image" && ["jpg", "png", "gif"].includes(s[1]))) {
          mimeSimple = "image"
        }
        else if (["music", "audio"].includes(s[0])) { mimeSimple = "audio" }
        else if (["video"].includes(s[0])) { mimeSimple = s[0] }
        else { mimeSimple = "data" }
        f['mimeSimple'] = mimeSimple
        supp_files.push(f) 
      }
      mimeTypes = [...new Set(supp_files.map(f => f.mimeSimple))];
    }
    return (
      <div className="c-tabcontent">
        <h1 className="c-tabcontent__main-heading" tabIndex="-1">Supplemental Material</h1>
        {supp_files && (supp_files.length > 1) &&
          <RefineComp mimeTypes={mimeTypes} filterType={this.state.filterType} changeType={this.changeType} />
        }
        {supp_files ?
          <MediaFileGridComp id={this.props.id} supp_files={supp_files} filterType={this.state.filterType} />
          : <div>No supplemental material included with this item</div>
        }
      </div>
    )
  }
}

module.exports = TabSupplementalComp;
