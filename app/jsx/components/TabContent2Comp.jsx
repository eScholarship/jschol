// ##### Tab Content 2 Component - Supplemental Materials ##### //

import React from 'react'

class TabContent2Comp extends React.Component {
  render() {
    let supp_files = this.props.attrs.supp_files,
      mimeTypes = [] 
    if (supp_files) {  
      mimeTypes = [...new Set(supp_files.map(f => f.mimeType))];
    }
    return (
      <div className="c-tab2">
        <h1 tabIndex="-1">Supplemental Material</h1>
        {supp_files ? 
          <FileDisplay mimeTypes={mimeTypes} supp_files={supp_files}/>
            : <div>No supplemental material included with this item</div> }
      </div>
    )
  }
}

class FileDisplay extends React.Component {
  render() {
    return (
      <div>
        { (this.props.mimeTypes.length > 1) ? <FilterByMimeType /> : null }
        <DownloadSelector />
        { this.props.supp_files.map(m =>
          <FileDisplayList key={m.file} metadata={m} />) }
      </div>
    )
  }
}


class FilterByMimeType extends React.Component {
  render() {
    return (
      <div>[Filter component here]</div>
    )
  }
}

class DownloadSelector extends React.Component {
  render() {
    return (
      <div>[Download component here]</div>
    )
  }
}

class FileDisplayList extends React.Component {
  render() {
    let m = this.props.metadata
    return (
      <ul>
      <li>
        {m.file}
      </li>
      <li>
	{m.title}
      </li>
      <li>
	{m.mimeType}
      </li>
      <li>
	{m.description}
      </li>
      </ul>
	// Other supplemental file characteristics stored in DB include:
	// creator
	// date_created
        // source
	// subject
	// type_other
    )
  }
}

module.exports = TabContent2Comp;
