// ##### PDF View Component ##### //

import React from 'react'
import PdfViewerComp from '../components/PdfViewerComp.jsx'

class PdfViewComp extends React.Component {
  view = () => {
    window.location = this.props.url 
  }

  render() {
    return (
      <details className="c-togglecontent" open>
        <summary>Main Content</summary>
        <div className="c-pdfview">
          <button onClick={() => {this.view()}} className="c-pdfview__button-download">Download PDF to View</button>
          <button onClick={() => {this.view()}} className="c-pdfview__button-view">View Larger</button>
        </div>
        <div className="c-pdfview__viewer">
          <PdfViewerComp url={this.props.url + "?nosplash=" + this.props.content_key}/>
        </div>
      </details>
    )
  }
}

module.exports = PdfViewComp;
