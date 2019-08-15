// ##### Media List Component ##### //
// Takes an array of hashes listing file types and counts of each:
// [{type: "pdf", count: 1}, {type: "image", count: 3}, etc

import React from 'react'

class MediaListComp extends React.Component {
  render() {
    let supp_files = this.props.supp_files.map(function(supp_file, i, a) {
      if (supp_file.count >= 1) {
        let display
        if (supp_file.type === 'video' || supp_file.type === 'image') {
          display = supp_file.count != 1 ? supp_file.type + 's' : supp_file.type
        } else if (supp_file.type === 'audio') {
          display = supp_file.count != 1 ? 'audio files' : 'audio file'
        } else if (supp_file.type === 'pdf') {
          display = supp_file.count != 1 ? 'PDFs' : 'PDF'
        } else if (supp_file.type === 'zip') {
          display = (<abbr title="zips">{supp_file.count != 1 ? 'ZIPs' : 'ZIP'}</abbr>)
        } else {
          display = supp_file.count != 1 ? 'files' : 'file'
        }
        return (<li key={supp_file+i} className={"c-medialist__" + supp_file.type}>{supp_file.count} supplemental {display}</li>)   
      }
    })
    return (
      <ul className="c-medialist">
        { supp_files }
      </ul>
    )
  }
}

export default MediaListComp;
