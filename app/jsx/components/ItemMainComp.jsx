// ##### Item View Tab: Main Component ##### //

import React from 'react'
import { Link } from 'react-router'
import $ from 'jquery'
import { PdfViewerComp } from '../components/AllComponents.jsx'

class ItemMainComp extends React.Component {
  getLink(id, service) {
    $.getJSON("/api/mediaLink/"+id+"/"+service).done((data) => {
      window.location = data.url
    }).fail((jqxhr, textStatus, err)=> {
      console.log("Failed! textStatus=", textStatus, ", err=", err)
    })
  }

  render() { 
    let p = this.props,
        pub_web_loc = p.attrs["pub_web_loc"].map(function(node, i) {
          return ( <span key={i}><a href={node}>{node}</a><br/></span> )
        }),
        abstr = p.attrs["abstract"],
        // Temporary styles till we get Joel's work
        floatRightStyle = {float: 'right'},
        rowStyle = {display: 'table'},
        leftStyle = {display: 'table-cell', width: '750px'},
        rightStyle = {display: 'table-cell', width: '100px', border: '1px solid black'},
        titleStyle = {fontSize: '1.2em'}
    return(
      <div className="content">
        <div style={rowStyle}>
          <div style={leftStyle}>
            <span style={floatRightStyle}>
              <a href="#" onClick={() => {this.getLink(p.id, "facebook")}}>Facebook</a>&nbsp;&nbsp;
              <a href="#" onClick={() => {this.getLink(p.id, "twitter")}}>Twitter</a>&nbsp;&nbsp;
              <a href="#" onClick={() => {this.getLink(p.id, "email")}}>Email</a>&nbsp;&nbsp;
              <a href="#" onClick={() => {this.getLink(p.id, "mendeley")}}>Mendeley</a>&nbsp;&nbsp;
              <a href="#" onClick={() => {this.getLink(p.id, "citeulike")}}>CiteULike</a>
            </span><br/>
            <font style={titleStyle}>{p.title}</font> <br/>
            {p.pub_date} <ItemMainAuthorsComp authors={p.authors} changeTab={this.props.changeTab}/>
            {pub_web_loc.length > 0 && <div>{pub_web_loc}</div>}
          </div>
          <div style={rightStyle}>
            {p.rights}
          </div>
        </div>
        {abstr && <div><br/>Abstract<br/>{abstr}</div>}
        <hr/>
        <Content
          {...p}
        />
      </div>
    )
  }
}

class ItemMainAuthorsComp extends React.Component {
  handleClick(tab_id) {
    this.props.changeTab(tab_id)
  }

  render() {
    let p = this.props,
        a = p.authors,
        expand = false 
    if (p.authors && p.authors.length > 6) {
      a = a.slice(0, 5)
      expand = true 
    }
    let authorList = a.map((node,i) => <span key={i}>{node}</span>)
      .reduce((accu, elem) => {
        return accu === null ? [elem] : [...accu, '; ', elem]
      }, null)
    return (
      <span>
        { p.authors && <span>&#124; {authorList} {this.renderExpand(expand)}</span> }
      </span>
    )
  }

  renderExpand(expand) { return(
    <span>
      {expand && <a href="#" onClick={this.handleClick.bind(this, 4)}>et al.</a>}
    </span>
  )}
}

class Content extends React.Component {
  render() {
    let p = this.props
    return (
    <div>
      { p.status == "published" && this.renderContent(p) }
      { p.status == "withdrawn" && this.renderNoContent("withdrawn", p.attrs['withdrawn_date']) }
      { p.status == "embargoed" && this.renderNoContent("embargoed", p.attrs['embargo_date']) }
    </div>
  )}

  renderContent(p) { return (
    <div>
      { p.content_type == "application/pdf" ? this.renderPdf(p) : null }
      { p.content_type == "text/html" ? this.renderHtml(p) : null } </div>
  )}

  renderPdf(p) { return (
    <div>
      Main text<br/>
      {/*Fetch content through server app, which will check credentials and proxy to proper back-end*/}
      <PdfViewerComp url={"/content/qt" + p.id + "/qt" + p.id + ".pdf"}/>
    </div>
  )}

  renderHtml(p) { return (
    <div>
      Main text<br/>
      <div dangerouslySetInnerHTML={{__html: p.content_html}}/>
      <br/><br/>
    </div>
  )}

  renderNoContent(reason, date) { return (
    <div>
    {reason=="withdrawn" && 
      <p>Withdrawn item:<br/>This item has been withdrawn.<br/><br/><br/></p>}
    {reason=="embargoed" && 
      <p>This item is embargoed until {date}.<br/><br/><br/></p>}
    </div>
  )}

}

module.exports = ItemMainComp;
