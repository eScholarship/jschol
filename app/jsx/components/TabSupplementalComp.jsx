// ##### Tab Supplemental Material Component ##### //

import React from 'react'
import MediaRefineComp from '../components/MediaRefineComp.jsx'
import MediaFileGridComp from '../components/MediaFileGridComp.jsx'

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
        let mimeSimple = "data"
        if (f.mimeType && f.mimeType != "unknown") {
          let s = f.mimeType.split('/')
          if ((s[0] == "text") ||
              (s[0] == "application" && ["pdf", "msword", "postscript", "wordperfect", "pdf"].includes(s[1]))) {
            mimeSimple = "doc"
          }
          else if ((s[0] == "image" && ["jpeg", "jpg", "png", "gif"].includes(s[1]))) {
            mimeSimple = "image"
          }
          else if (["music", "audio"].includes(s[0])) { mimeSimple = "audio" }
          else if (["video"].includes(s[0])) { mimeSimple = s[0] }
          else { mimeSimple = "data" }
        }
        f['mimeSimple'] = mimeSimple
        f['doi'] = f.doi
        supp_files.push(f) 
      }
      mimeTypes = [...new Set(supp_files.map(f => f.mimeSimple))];
    }
    return (
      <div className="c-tabcontent">
        <h1 className="c-tabcontent__main-heading" tabIndex="-1">Supplemental Material</h1>
        {supp_files && (supp_files.length > 1) && (mimeTypes.length > 1) &&
          <MediaRefineComp mimeTypes={mimeTypes} filterType={this.state.filterType} changeType={this.changeType} />
        }
        {supp_files ?

          <MediaFileGridComp id={this.props.id} supp_files={supp_files} filterType={this.state.filterType}
                             preview_key={this.props.preview_key}/> 

          : <div>No supplemental material included with this item</div>
        }
      </div>
    )
  }
}

export default TabSupplementalComp;
