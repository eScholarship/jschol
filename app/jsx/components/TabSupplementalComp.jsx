// ##### Tab Supplemental Material Component ##### //

import React from 'react'
import MediaFileGridComp from '../components/MediaFileGridComp.jsx'

class RefineComp extends React.Component {
  render() {
    return (
      <div className="c-itemactions">
        <div className="o-input__droplist2">
          <label htmlFor="o-input__droplist-label2">Refine media type by:</label>
          <select name="" id="o-input__droplist-label2">
            <option value="">All</option>
            <option value="">Documents</option>
            <option value="">Images</option>
            <option value="">Videos</option>
            <option value="">Others</option>
          </select>
        </div>
        <div className="o-download">
          <button className="o-download__button">Download All Files</button>
          <details className="o-download__formats">
            <summary aria-label="formats"></summary>
            <ul className="o-download__single-menu">
              <li><a href="">Image</a></li>
              <li><a href="">Audio</a></li>
              <li><a href="">Video</a></li>
              <li><a href="">Zip</a></li>
              <li><a href="">File</a></li>
            </ul>
          </details>
        </div>
      </div>
    ) 
  }
}

class TabSupplementalComp extends React.Component {
  render() {
    let supp_files = this.props.attrs.supp_files,
      mimeTypes = [] 
    if (supp_files) {  
      mimeTypes = [...new Set(supp_files.map(f => f.mimeType))];
    }
    return (
      <div className="c-tabcontent">
        <h1 className="c-tabcontent__main-heading" tabIndex="-1">Supplemental Material</h1>
        {supp_files && (mimeTypes.length > 1) && 
          <RefineComp mimeTypes={mimeTypes} />
        }
        {supp_files ?
          <MediaFileGridComp supp_files={supp_files}  />
          : <div>No supplemental material included with this item</div>
        }
      </div>
    )
  }
}

module.exports = TabSupplementalComp;
