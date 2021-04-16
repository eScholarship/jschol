// ##### Media File Grid Component ##### //

import React from 'react'
import MediaModalComp from '../components/MediaModalComp.jsx'
import MediaFeatureObj from '../objects/MediaFeatureObj.jsx'
import $ from 'jquery'
import { Link } from 'react-router-dom'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class CellComp extends React.Component {
  state={showModal: false}

  handleOpenModal = () => this.setState({ showModal: true });
  handleCloseModal = () => this.setState({ showModal: false });

  render() {
    let p = this.props,
        url = (p.preview_key ? "/preview/" : "/content/") +
              "qt" + p.id + "/supp/" + p.file +
              (p.preview_key ? "?preview_key=" + p.preview_key : ""),
        mimeSimple = (p.mimeSimple=="doc") ? "data" : p.mimeSimple,
        m = { "audio": "play audio file", "image": "view larger", "video": "play video file" },
        fileLabel = m[mimeSimple] ? m[mimeSimple] : p.file 
    return (
      <div className={"o-mediafile--" + mimeSimple}>
        <h2 className="o-mediafile__heading" ref={ el => { if (p.title && p.title.length > 38) $(el).dotdotdot({watch:"window"}) } }>{p.title}</h2>
        <div className="o-mediafile__preview" onClick={this.handleOpenModal} aria-label={fileLabel} target="_blank">
          {(mimeSimple == "image") &&
            <img className="o-mediafile__image" src={url} alt={p.file} />
          }
        </div>
        <div className="o-mediafile__description" ref={ el => { if (p.description && p.description.length > 0) $(el).dotdotdot({watch:"window"}) } }>
          {p.description}</div>
        
        <button className="o-mediafile__view" onClick={this.handleOpenModal}><span>View Media</span></button>
        <a href={url} className="o-mediafile__download" download={p.file}>Download</a>
        <a href={p.doi}>{p.doi}</a>
        <MediaModalComp showModal={this.state.showModal} handleCloseModal={this.handleCloseModal}>
          <MediaFeatureObj file={p.file} url={url} type={mimeSimple} title={p.title} description={p.description} />
        </MediaModalComp>
      </div>
    )
  }
}

class MediaFileGridComp extends React.Component {
  getVisibleFiles(files, filterType) {
    let foundOne = false
    let r = files.map((f, i) => {
      let title = f.title,
          doi = f.doi,
          description = f.description,
          useFilenameForTitle = false 
      if (!f.title) {
        title = description
        description = '' 
        // Use filename when BOTH title AND description empty (typically no spaces, so dotdotdot)
        if (!f.description) {
          useFilenameForTitle = true
          title = f.file 
        }
      }
      let p = (f['mimeSimple'].includes(filterType) || filterType =="") &&
            <CellComp key={i}
                      id={this.props.id}
                      mimeSimple={f.mimeSimple}
                      title={title}
                      file={f.file}
                      doi={f.doi}
                      description={description} 
                      useFilenameForTitle={useFilenameForTitle}
                      preview_key={this.props.preview_key} />
      if (p) {foundOne = true}
      return p
    })
    return foundOne ? r : false
  }

  render() {
    let visibleFiles = this.getVisibleFiles(this.props.supp_files, this.props.filterType)
    return (
      <div className="c-mediafilegrid">
        {visibleFiles ? visibleFiles : <p>No files found matching that mime type.<br/><br/><br/></p>}
      </div>
    )
  }
}

export default MediaFileGridComp;
