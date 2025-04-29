// ##### PDF View Component ##### //

import React from 'react'
import ScrollingAnchorComp from "../components/ScrollingAnchorComp.jsx"
import { Document, Page, pdfjs } from 'react-pdf';
import Breakpoints from '../../js/breakpoints.json'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// TODO:
// use worker shipped with react-pdf: https://www.npmjs.com/package/react-pdf#configure-pdfjs-worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// const H_SERVER = 'https://hypothes.is'

// class HypothesisClient extends React.Component {
//   // Re-initialize on back button
//   componentDidMount() {

//     let oldHypothesisDestroyed = false

//     // Wait for pdf.js to initialize before loading Hypothesis
//     let timeout = 0
//     this.pdfWatch = setInterval(()=>{

//       // Get rid of existing Hypothesis that might have been loaded by the
//       // browser extension, because it won't figure out we've got pdf.js here
//       // since we load it late.
//       if (!oldHypothesisDestroyed && this.destroyHypothesis()) {
//         oldHypothesisDestroyed = true
//         timeout = 800
//       }

//       let page = document.querySelectorAll('#pdfjs-viewer .page')
//       if (!page || page.length == 0)
//         return

//       clearInterval(this.pdfWatch)
//       this.pdfWatch = null

//       setTimeout(()=>{
//         // Install Hypothesis for current URL
//         var embedScriptEl = document.createElement('script')
//         window.hypothesisConfig = function () {
//           return {
//             //constructor: Annotator.Sidebar,
//             app: 'https://hypothes.is/app.html'
//           }
//         }
//         //embedScriptEl.src = "/hypoth/build/boot.js"
//         embedScriptEl.src = H_SERVER + '/embed.js'
//         console.log("Installing Hypothesis.")
//         document.head.appendChild(embedScriptEl)
//       }, timeout)
//     }, 200)
//   }

//   destroyHypothesis() {
//     const annotatorLink = document.querySelector(
//       'link[type="application/annotator+html"]'
//     );

//     if (annotatorLink) {
//       console.log("Destroying Hypothesis.")

//       // Dispatch a 'destroy' event which is handled by the code in
//       // annotator/main.js to remove the client. Timeout below is because
//       // sometimes the annotator link exists before the client has fully
//       // initialized itself, and sending it a destroy event prior to that
//       // just doesn't work.
//       setTimeout(()=> {
//         var destroyEvent = new Event('destroy');
//         annotatorLink.dispatchEvent(destroyEvent);

//         // The browser extension overrides all settings. Get rid of them.
//         const settingsElements = document.querySelectorAll('script.js-hypothesis-config');
//         for (let i = 0; i < settingsElements.length; i++)
//           settingsElements[i].remove()
//       }, 500)

//       return true
//     }
//     else
//       return false
//   }

//   // Close out when disappearing
//   componentWillUnmount() {
//     if (this.pdfWatch) {
//       clearInterval(this.pdfWatch)
//       this.pdfWatch = null
//     }
//     this.destroyHypothesis()
//   }

//   render = () =>
//     <div id="hypothesis-placeholder"/>
// }

class PdfViewComp extends React.Component {
  pageRefs = []

  state = {
    numPages: null,
  }

  onLoadSuccess = ({ numPages }) => {
    // ensure that scrolling happens AFTER document has loaded
    this.setState({ numPages }, () => {
      this.scrollToPageNum()
    })
  }

  // respond to pageNum updates coming from parent props (user clicks toc item or hash changes)
  componentDidUpdate(prevProps) {
    if (prevProps.pageNum !== this.props.pageNum) {
      this.scrollToPageNum()
    }
  }

  scrollToPageNum = () => {
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout)
  
    const pageRef = this.pageRefs?.[this.props.pageNum - 1]
    if (pageRef) {
      this.scrollTimeout = setTimeout(() => {
        pageRef.scrollIntoView({ behavior: "smooth" })
      }, 200)
    }
  }
  
  componentWillUnmount() {
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout)
  }
  

  view = () => {
    if (this.props.download_restricted) {
      alert("Download restricted until " + this.props.download_restricted)
    } else {
      let separator = this.props.url.indexOf("?") >= 0 ? "&" : "?"
      window.location =
        this.props.url +
        separator +
        "v=lg" +
        (this.props.preview_key ? "&preview_key=" + this.props.preview_key : "")
    }
  }

  // Make a best effort to avoid re-initting pdf.js, which loses page context
  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.props.url !== nextProps.url ||
      // we want the component to re-render if there's state changes (numPages)
      this.state.numPages !== nextState.numPages ||
      this.props.containerWidth !== nextProps.containerWidth ||
      this.props.pageNum !== nextProps.pageNum
    )
  }

  get_pdfjs_width = () => {
    const totalWidth = window.innerWidth
    return (totalWidth >= parseInt(Breakpoints.screen2))
      ? (totalWidth * (1.0 - 0.28)) - 120 // sidebar occupies 28% in this mode
      : totalWidth - 21 // no sidebar in this mode
  }

  getScale = () => {
    const baseWidth = 600
    const availableWidth = this.get_pdfjs_width() - 50
    const scale = availableWidth / baseWidth
    return Math.min(Math.max(scale, 0.5), 2) // constrain scale
  }

  render() {
    const { numPages } = this.state
    const { url, content_key, preview_key, viewerRef } = this.props
    const separator = url.indexOf("?") >= 0 ? "&" : "?"

    const fileUrl =
      url.replace(".pdf", `_noSplash_${content_key}.pdf`) +
      (preview_key ? `${separator}preview_key=${preview_key}` : "")

    return (
      <details className="c-togglecontent" open>
        <ScrollingAnchorComp name="article_main" />
        <summary>Main Content</summary>
        <div className="c-pdfview">
          <button onClick={this.view} className="c-pdfview__button-download">
            Download PDF to View
          </button>
          <button onClick={this.view} className="c-pdfview__button-view">
            View Larger
          </button>
        </div>

        {!this.props.download_restricted && (
          <div className="c-pdfview__accessibility">
            For improved accessibility of PDF content,{" "}
            <a href={fileUrl}>download the file</a> to your device.
          </div>
        )}

        <div className="c-pdfview__viewer" ref={viewerRef}>
          <Document 
            file={fileUrl} 
            onLoadSuccess={this.onLoadSuccess} 
            loading="Loading..."
          >
            {Array.from(new Array(numPages), (_el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                scale={this.getScale()}
                inputRef={el => this.pageRefs[index] = el}
              />
            ))}
          </Document>
        </div>

        {/* {this.props.commenting_ok && <HypothesisClient />} */}
      </details>
    )
  }
}

export default PdfViewComp;
