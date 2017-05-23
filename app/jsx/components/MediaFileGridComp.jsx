// ##### Media File Grid Component ##### //

import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router'

class CellComp extends React.Component {
  url = "/content/qt" + this.props.id + "/supp/" + this.props.file

  download = () => {
    event.preventDefault()
    window.open(this.url)
  }

  render() {
    let p = this.props,
        mimeSimple = (p.mimeSimple=="doc") ? "data" : p.mimeSimple,
        m = { "audio": "play audio file", "image": "view larger", "video": "play video file" },
        fileLabel = m[mimeSimple] ? m[mimeSimple] : p.file 
    return (
      <div className={"o-mediafile--" + mimeSimple}>
        {/* Some items have no titles but use descriptions instead, and these get moved into title.
            Let's make these look better (and load faster) by avoiding dotdotdot in this case only.
        */}
        <h2 className="o-mediafile__heading" ref={ el => { if ((p.useFilenameForTitle) || (p.description && p.description.length > 0)) $(el).dotdotdot({watch:"window"}) } }>
          <Link to={this.url} target="_blank">{p.title}</Link>
        </h2>
        <Link className="o-mediafile__link" to={this.url} aria-label={fileLabel} target="_blank">
          {(mimeSimple == "image") &&
            <img className="o-mediafile__image" src={this.url} alt={p.file} />
          }
        </Link>
        <button onClick={() => {this.download()}} className="o-mediafile__button">Download</button>
        <div className="o-mediafile__description" ref={ el => { if (p.description && p.description.length > 0) $(el).dotdotdot({watch:"window"}) } }>
          {p.description}</div>
      </div>
    )
  }
}

class MediaFileGridComp extends React.Component {
  getVisibleFiles(files, filterType) {
    let foundOne = false
    let r = files.map((f, i) => {
      let title = f.title,
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
                      description={description} 
                      useFilenameForTitle={useFilenameForTitle} />
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

module.exports = MediaFileGridComp;
