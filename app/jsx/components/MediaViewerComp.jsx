// ##### Media Viewer Component ##### //

import React from 'react'
import MediaRefineComp from '../components/MediaRefineComp.jsx'
import MediaFeatureObj from '../objects/MediaFeatureObj.jsx'
import MediaViewerObj from '../objects/MediaViewerObj.jsx'

class MediaViewerComp extends React.Component {
  state= { filterType: "", mediaFeature: null,
           featureFile: "", featureUrl: "", featureMimesimple: "", featureTitle: "", featureDescription: "", featureTrackFiles: [] }

  changeType = event => {
    this.setState({filterType: event.target.value})
  }

  // TODO: add helpers to extract language and label from track files (e.g. <track srclang={language} label={label} />)

  // helper to find track files associated with a video file
  findTrackFiles = (videoFileName, allFiles) => {
    if (!allFiles) return []
    console.log(videoFileName, allFiles)
    
    // look for vtt files
    const trackFiles = allFiles.filter(f => f.file.endsWith('.vtt'))
    console.log('tf', trackFiles)

    return trackFiles.map(f => ({
      url: (this.props.preview_key ? "/preview/" : "/content/") +
           "qt" + this.props.id + "/supp/" + f.file +
           (this.props.preview_key ? "?preview_key="+this.props.preview_key : ""),
      language: 'en',
      label: 'Captions'
    }))
  }

  openViewer = (featureNumber, featureFile, featureUrl, featureMimesimple, featureTitle, featureDescription, trackFiles)=> {
    this.setState({mediaFeature: featureNumber,
                   featureFile: featureFile, featureUrl: featureUrl,
                   featureMimesimple: featureMimesimple, featureTitle: featureTitle,
                   featureDescription: featureDescription, featureTrackFiles: trackFiles || [] })
    this.mediaViewerFeature.focus()
    this.mediaViewerFeature.scrollIntoView({ behavior: 'smooth' })
  }

  getVisibleFiles(files, filterType) {
    // TODO: De-duplicate this code, currently shared with MediaFileGridComp
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
      let type = { "audio": 1, "data": 2, "image": 3, "video": 4 },
          // mimeSimple is being used within user dropdown filter (MediaRefineComp),
          // which uses a slightly more granular list of mimetypes: It includes 'doc'
          // (for things like PDF and Word).  But for the comeponent definition 
          // we are only wortking with 'audio', 'data', 'imag', and 'video'
          // ..so in this case 'doc' gets lumped into 'data'
          mimeSimple = (f['mimeSimple']=="doc") ? "data" : f['mimeSimple'],
          c
      if (f['mimeSimple'].includes(filterType) || filterType =="") {
        let url=(this.props.preview_key ? "/preview/" : "/content/") +
                "qt" + this.props.id + "/supp/" + f.file +
                (this.props.preview_key ? "?preview_key="+this.props.preview_key : "")
        const trackFiles = mimeSimple === 'video' ? this.findTrackFiles(f.file, files) : []
        console.log('trackFiles', trackFiles)
        
        c = <MediaViewerObj key={i}
              mimeSimple={mimeSimple}
              title={title}
              file={f.file}
              description={description}
              url={url}
              isSelected={this.state.mediaFeature == type[mimeSimple]}
              openViewer={()=> this.openViewer(
                type[mimeSimple], f.file, url, mimeSimple, title, description, trackFiles)} />
      }
      if (c) {foundOne = true}
      return c
    })
    return foundOne ? r : false
  }

  render() {
    // TODO: De-duplicate this code, currently shared with TabSupplementalComp
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
    let visibleFiles = this.getVisibleFiles(supp_files, this.state.filterType)
    return (
      <div className="c-mediaviewer">
        <div className="c-mediaviewer__feature" ref={el => this.mediaViewerFeature = el} tabIndex="-1">
          {this.state.mediaFeature && this.state.mediaFeature != "" ?
            <MediaFeatureObj
                file = {this.state.featureFile}
                url = {this.state.featureUrl}
                type = {this.state.featureMimesimple}
                title = {this.state.featureTitle}
                description = {this.state.featureDescription}
                trackFiles = {this.state.featureTrackFiles} />
            : null
          }
        </div>

        {/* ItemActions Component */}
        {supp_files && (supp_files.length > 1) && (mimeTypes.length > 1) &&
          <MediaRefineComp mimeTypes={mimeTypes} filterType={this.state.filterType} changeType={this.changeType} />
        }

        {/* MediaFileGrid Component */}
      {supp_files ?
        <div className="c-mediafilegrid">
          {visibleFiles ? visibleFiles : <p>No files found matching that mime type.<br/><br/><br/></p>}
        </div>
        : <div className="c-mediafilegrid">No supplemental material included with this item</div>
      }
      </div>
    )
  }
}

export default MediaViewerComp;
