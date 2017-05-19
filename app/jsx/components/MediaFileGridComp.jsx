// ##### Media File Grid Component ##### //

import React from 'react'
import $ from 'jquery'

class CellComp extends React.Component {
  url = "/content/qt" + this.props.id + "/supp/" + this.props.file

  render() {
    let p = this.props,
        mimeSimple = (p.mimeSimple=="doc") ? "data" : p.mimeSimple,
        m = { "audio": "play audio file", "image": "view larger", "video": "play video file" },
        fileLabel = m[mimeSimple] ? m[mimeSimple] : p.file 
    return (
      <div className={"o-mediafile--" + mimeSimple}>
        <h2 className="o-mediafile__heading" ref={ el => $(el).dotdotdot({watch:"window"}) }>
          <a href="">{p.title}</a>
        </h2>
        <a className="o-mediafile__link" href={this.url} aria-label={fileLabel}>
          {(mimeSimple == "image") &&
            <img className="o-mediafile__image" src={this.url} alt={p.file} />
          }
        </a>
        <button className="o-mediafile__button">Download</button>
        <div className="o-mediafile__description" ref={ el => $(el).dotdotdot({watch:"window"}) }>
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
          description = f.description 
      if (!f.title) {
        title = description
        description = '' 
      }
      let p = (f['mimeSimple'].includes(filterType) || filterType =="") &&
            <CellComp key={i}
                      id={this.props.id}
                      mimeSimple={f.mimeSimple}
                      title={title}
                      file={f.file}
                      description={description} />
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
