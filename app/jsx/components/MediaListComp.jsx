// ##### Media List Component ##### //

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
          display = supp_file.count != 1 ? 'ZIPs' : 'ZIP'
        } else {
          display = supp_file.count != 1 ? 'files' : 'file'
        }
        return (<li key={supp_file+i} className={"c-medialist__" + supp_file.type}>Contains {supp_file.count} supplemental {display}</li>)   
      }
    })
    return (
      <ul className="c-medialist">
        { supp_files }
      </ul>
    )
  }
}

module.exports = MediaListComp;
