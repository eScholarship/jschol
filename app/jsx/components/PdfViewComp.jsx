// ##### PDF View Component ##### //

import React from 'react'
import ScrollingAnchorComp from "../components/ScrollingAnchorComp.jsx"
import PdfViewerComp from '../components/PdfViewerComp.jsx'

const H_SERVER = 'https://hypothes.is'

class HypothesisClient extends React.Component
{
  // Re-initialize on back button
  componentDidMount() {

    let oldHypothesisDestroyed = false

    // Wait for pdf.js to initialize before loading Hypothesis
    let timeout = 0
    this.pdfWatch = setInterval(()=>{

      // Get rid of existing Hypothesis that might have been loaded by the
      // browser extension, because it won't figure out we've got pdf.js here
      // since we load it late.
      if (!oldHypothesisDestroyed && this.destroyHypothesis()) {
        oldHypothesisDestroyed = true
        timeout = 800
      }

      let page = document.querySelectorAll('#pdfjs-viewer .page')
      if (!page || page.length == 0)
        return

      clearInterval(this.pdfWatch)
      this.pdfWatch = null

      setTimeout(()=>{
        // Install Hypothesis for current URL
        var embedScriptEl = document.createElement('script')
        window.hypothesisConfig = function () {
          return {
            //constructor: Annotator.Sidebar,
            app: 'https://hypothes.is/app.html'
          }
        }
        //embedScriptEl.src = "/hypoth/build/boot.js"
        embedScriptEl.src = H_SERVER + '/embed.js'
        console.log("Installing Hypothesis.")
        document.head.appendChild(embedScriptEl)
      }, timeout)
    }, 200)
  }

  destroyHypothesis() {
    const annotatorLink = document.querySelector(
      'link[type="application/annotator+html"]'
    );

    if (annotatorLink) {
      console.log("Destroying Hypothesis.")

      // Dispatch a 'destroy' event which is handled by the code in
      // annotator/main.js to remove the client. Timeout below is because
      // sometimes the annotator link exists before the client has fully
      // initialized itself, and sending it a destroy event prior to that
      // just doesn't work.
      setTimeout(()=> {
        var destroyEvent = new Event('destroy');
        annotatorLink.dispatchEvent(destroyEvent);

        // The browser extension overrides all settings. Get rid of them.
        const settingsElements = document.querySelectorAll('script.js-hypothesis-config');
        for (let i = 0; i < settingsElements.length; i++)
          settingsElements[i].remove()
      }, 500)

      return true
    }
    else
      return false
  }

  // Close out when disappearing
  componentWillUnmount() {
    if (this.pdfWatch) {
      clearInterval(this.pdfWatch)
      this.pdfWatch = null
    }
    this.destroyHypothesis()
  }

  render = () =>
    <div id="hypothesis-placeholder"/>
}

class PdfViewComp extends React.Component {
  view = () => {
    if (this.props.download_restricted)
      alert("Download restricted until " + this.props.download_restricted)
    else {
      let separator = this.props.url.indexOf("?") >= 0 ? "&" : "?"
      window.location = this.props.url + separator + "v=lg" +
                        (this.props.preview_key ? "&preview_key=" + this.props.preview_key : "")
    }
  }

  // Make a best effort to avoid re-initting pdf.js, which loses page context
  shouldComponentUpdate(nextProps, nextState) {
    return !(this.props.url == nextProps.url)
  }

  render() {
    let separator = this.props.url.indexOf("?") >= 0 ? "&" : "?"
    let pdf_url = this.props.url.replace(".pdf", "_noSplash_" + this.props.content_key + ".pdf") + (this.props.preview_key ? separator+"preview_key=" + this.props.preview_key : "")
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
        <div className="c-pdfview__accessibility">
          For improved accessibility of PDF content, {this.props.download_restricted 
          ? <a href={pdf_url} onClick={()=>{alert("Download restricted until " + this.props.download_restricted); return false}}>Download PDF</a>
          : <a href={pdf_url} >download the file</a> } to your device.  
        </div>
        <div className="c-pdfview__viewer">
          <PdfViewerComp url={this.props.url.replace(".pdf", "_noSplash_" + this.props.content_key + ".pdf")
                              + (this.props.preview_key ? separator+"preview_key=" + this.props.preview_key : "")}/>
        </div>
        { this.props.commenting_ok && <HypothesisClient/> }
      </details>
    )
  }
}

export default PdfViewComp;
