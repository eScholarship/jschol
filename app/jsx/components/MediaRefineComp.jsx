// ##### Media Refine Component ##### //

import React from 'react'

class MediaRefineComp extends React.Component {
  render() {
    let mimeSimpleLabel = { 'audio':'Audio', 'data':'Others', 'doc':'Documents', 'image':'Images', 'video':'Videos' }
    return (
      <div className="c-itemactions">
        <div className="o-input__droplist2">
          <label htmlFor="o-input__droplist-label2">Refine media type by:</label>
          <select name="filterType" id="o-input__droplist-label2" onChange={this.props.changeType} value={this.props.filterType}>
            <option value="">All</option>
          { this.props.mimeTypes.map((type) => {
            return (<option key={type} value={type}>{mimeSimpleLabel[type]}</option>)
          })}
          </select>
        </div>
        <div className="o-download">
      {/*
        ToDo: Implement this functionality.
        But for the time being, this div does need to stay here. CSS has been styled to expect it.

        {(this.props.mimeTypes.length > 1) ? 
          [<a key="0" href="" className="o-download__button" download="">Download All Files</a>,
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
      */}
        </div>
      </div>
    ) 
  }
}

module.exports = MediaRefineComp;
