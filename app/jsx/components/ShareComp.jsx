// ##### Share Component ##### //

import React from 'react'
import $ from 'jquery'
import { DropdownMenu, Menu_a } from '../components/DropdownMenu.jsx'

class ShareComp extends React.Component {
  getLink = (type, id, service) => {
    $.getJSON("/api/mediaLink/"+type+"/"+id+"/"+service).done((data) => {
      window.location = data.url
    }).fail((jqxhr, textStatus, err)=> {
      console.log("Failed! textStatus=", textStatus, ", err=", err)
    })
  }

  render() {
    let p = this.props
    return (
      <DropdownMenu detailsClass="c-share" summarySpan="Share">
        <ul className="c-share__list">
          <li><Menu_a className="c-share__email" href="#" onClick={() => {this.getLink(p.type, p.id, "email")}}>Email</Menu_a></li>
          <li><Menu_a className="c-share__facebook" href="#" onClick={() => {this.getLink(p.type, p.id, "facebook")}}>Facebook</Menu_a></li>
          <li><Menu_a className="c-share__twitter" href="#" onClick={() => {this.getLink(p.type, p.id, "twitter")}}>Twitter</Menu_a></li>
        </ul>
      </DropdownMenu>
    )
  }
}

module.exports = ShareComp;
