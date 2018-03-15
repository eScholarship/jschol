// ##### Media Viewer Component ##### //

import React from 'react'
import MediaRefineComp from '../components/MediaRefineComp.jsx'
import MediaFeatureObj from '../objects/MediaFeatureObj.jsx'
import MediaViewerObj from '../objects/MediaViewerObj.jsx'

class MediaViewerComp extends React.Component {
  state= { mediaFeature: null,
           filterType: ""     }

  changeType = event => {
    this.setState({filterType: event.target.value})
  }

  openViewer = (featureNumber)=> {
    this.setState({mediaFeature: featureNumber})
    this.mediaViewerFeature.focus()
    this.mediaViewerFeature.scrollIntoView({ behavior: 'smooth' })
  }

  getVisibleFiles(files, filterType) {
    let foundOne = false
    let r = files.map((f, i) => {
      let title = f.title,
          description = f.description
      if (!f.title) {
        title = description
        description = '' 
        // Use filename when BOTH title AND description empty (typically no spaces, so dotdotdot)
        if (!f.description) {
          title = f.file 
        }
      }
      let type = { "audio": 1, "data": 2, "image": 3, "video": 4 }
      let c = (f['mimeSimple'].includes(filterType) || filterType =="") &&
          <MediaViewerObj key={i}
                      id={this.props.id}
                      mimeSimple={f.mimeSimple}
                      title={title}
                      file={f.file}
                      description={description} 
                      content_prefix={this.props.content_prefix} 
                      isSelected={this.state.mediaFeature == type[f.mimeSimple]}
                      openViewer={()=> this.openViewer(type[f.mimeSimple])} />
      if (c) {foundOne = true}
      return c
    })
    return foundOne ? r : false
  }

  render() {
    let p = this.props,
        supp_files_orig = p.supp_files,
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
        supp_files.push(f) 
      }
      mimeTypes = [...new Set(supp_files.map(f => f.mimeSimple))];
    }
    console.log("content prefix = ", this.props.content_prefix)
    console.log("orig supp files = ", this.props.supp_files)
    console.log("supp files = ", supp_files)
    let visibleFiles = this.getVisibleFiles(supp_files, this.props.filterType)
    return (
      <div className="c-mediaviewer">
        <div className="c-mediaviewer__feature" ref={el => this.mediaViewerFeature = el} tabIndex="-1">
          <MediaFeatureObj file={p.file} url={url} type={mimeSimple} title={p.title} description={p.description} />
          {/* this.state.mediaFeature == 1 ? <MediaFeatureAudioObj /> : null}
          {this.state.mediaFeature == 2 ? <MediaFeatureDataObj /> : null}
          {this.state.mediaFeature == 3 ? <MediaFeatureImageObj /> : null}
          {this.state.mediaFeature == 4 ? <MediaFeatureVideoObj /> : null */}
        </div>
        {/* ItemActions Component */}
        {supp_files && (supp_files.length > 1) &&
          <MediaRefineComp mimeTypes={mimeTypes} filterType={this.state.filterType} changeType={this.changeType} />
        }
        {/* MediaFileGrid Component */}
      {supp_files ?
        <div className="c-mediafilegrid">
          {visibleFiles ? visibleFiles : <p>No files found matching that mime type.<br/><br/><br/></p>}
          {/* <MediaViewerAudioObj
            isSelected={this.state.mediaFeature == 1}
            openViewer={()=> this.openViewer(1)} />
          <MediaViewerDataObj
            isSelected={this.state.mediaFeature == 2}
            openViewer={()=> this.openViewer(2)} />
          <MediaViewerImageObj
            isSelected={this.state.mediaFeature == 3}
            openViewer={()=> this.openViewer(3)} />
          <MediaViewerVideoObj
            isSelected={this.state.mediaFeature == 4}
            openViewer={()=> this.openViewer(4)} /> */}
        </div>
        : <div className="c-mediafilegrid">No supplemental material included with this item</div>
      }
      </div>
    )
  }
}

module.exports = MediaViewerComp;
