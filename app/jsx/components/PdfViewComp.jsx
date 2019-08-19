// ##### PDF View Component ##### //

import React from 'react'
import ScrollingAnchorComp from "../components/ScrollingAnchorComp.jsx"
import PdfViewerComp from '../components/PdfViewerComp.jsx'

class PdfViewComp extends React.Component {
  view = () => {
    if (this.props.download_restricted)
      alert("Download restricted until " + this.props.download_restricted)
    else {
      let separator = this.props.url.indexOf("?") >= 0 ? "&" : "?"
      window.location = this.props.url + separator + "v=lg"
    }
  }

  render() {
    let separator = this.props.url.indexOf("?") >= 0 ? "&" : "?"
    return (
      <details className="c-togglecontent" open>
        {/* ScrollingAnchor sits here and not above because c-togglecontent styling relies on
            coming right after it's sibling of the same class name */}
        <ScrollingAnchorComp name="article_main" />
        <summary>Main Content</summary>
        <div className="c-pdfview">
          <button onClick={() => {this.view()}} className="c-pdfview__button-download">Download PDF to View</button>
          <button onClick={() => {this.view()}} className="c-pdfview__button-view">View Larger</button>
        </div>
        <div className="c-pdfview__viewer">
          <PdfViewerComp url={this.props.url + separator + "nosplash=" + this.props.content_key}/>
        </div>
      </details>
    )
  }
}

export default PdfViewComp;
