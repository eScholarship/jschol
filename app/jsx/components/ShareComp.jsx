// ##### Share Component ##### //

import React from 'react'
import $ from 'jquery'

class ShareComp extends React.Component {
  getLink = (id, service) => {
    $.getJSON("/api/mediaLink/"+id+"/"+service).done((data) => {
      window.location = data.url
    }).fail((jqxhr, textStatus, err)=> {
      console.log("Failed! textStatus=", textStatus, ", err=", err)
    })
  }

  render() {
    let p = this.props
    return (
      <div className="c-share">
        <a href="#" onClick={() => {this.getLink(p.id, "facebook")}}>Facebook</a>&nbsp;&nbsp;
        <a href="#" onClick={() => {this.getLink(p.id, "twitter")}}>Twitter</a>&nbsp;&nbsp;
        <a href="#" onClick={() => {this.getLink(p.id, "email")}}>Email</a>&nbsp;&nbsp;
        <a href="#" onClick={() => {this.getLink(p.id, "mendeley")}}>Mendeley</a>&nbsp;&nbsp;
        <a href="#" onClick={() => {this.getLink(p.id, "citeulike")}}>CiteULike</a>
      </div>
    )
  }
}

module.exports = ShareComp;
