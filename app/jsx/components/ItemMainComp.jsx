// ##### Item View Tab: Main Component ##### //

import React from 'react'
import { PdfViewerComp } from '../components/AllComponents.jsx'

class ItemMainComp extends React.Component {
  render() { 
    let p = this.props,
        pub_web_loc = p.attrs["pub_web_loc"],
        abstr = p.attrs["abstract"],
        // Temporary styles till we get Joel's work
        rowStyle = {display: 'table'},
        leftStyle = {display: 'table-cell', width: '750px'},
        rightStyle = {display: 'table-cell', width: '100px', border: '1px solid black'},
        titleStyle = {fontSize: '1.2em'}
    return(
      <div className="content">
        <div style={rowStyle}>
          <div style={leftStyle}>
            <font style={titleStyle}>{p.title}</font> <br/>
            {p.pub_date} | {p.authors} <br/>
            {pub_web_loc && <div>Published Web Location<br/><a href={pub_web_loc}>{pub_web_loc}</a></
div>}
          </div>
          <div style={rightStyle}>
            {p.rights}
          </div>
        </div>
        {abstr && <div>Abstract<br/>{abstr}</div>}
        <hr/>
        <Content
          {...p}
        />
      </div>
    )
  }
}

class Content extends React.Component {
  render() { return (
    <div>
      {this.props.content_type == "application/pdf" ? this.renderPdf(this.props) : null }
      {this.props.content_type == "html" ? this.renderHtml(this.props) : null }
    </div>
  )}

  renderPdf(p) { return(
    <div>
      Main text<br/>
      {/* Fetch PDF from a special place which supports returning CORS headers. E.g. transform item I
D "9k10r3sc" into:
          http://pub-eschol-stg.escholarship.org/raw_data/13030/pairtree_root/qt/9k/10/r3/sc/qt9k10r3
sc/content/qt9k10r3sc.pdf */}
      <PdfViewerComp url={"http://pub-eschol-stg.escholarship.org/raw_data/13030/pairtree_root/qt/" +
                     p.id.match(/(..?)/g).join("/") + "/qt" + p.id + "/content/qt" + p.id + ".pdf" }/
>
    </div>
  )}

  renderHtml(p) { return(
    <div>
      Main text<br/>
      Placeholder: ToDo
    </div>
  )}

}

module.exports = ItemMainComp;
