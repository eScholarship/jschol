// ##### Unit Item Objects ##### //

import React from 'react'
import $ from 'jquery'
import dotdotdot from 'jquery.dotdotdot'

class UnitItemObj extends React.Component {
  componentDidMount() {
    $('.o-unititem__title, .o-unititem__author').dotdotdot({
      watch: 'window'
    });
    setTimeout(()=> $('.o-unititem__author').trigger("update"), 0)
  }
  render() {
    return (
      <div>

        <h2>Unit Item Objects</h2>

        <a href="" className="o-unititem--vert">
          <h3 className="o-unititem__type--article">Article</h3>
          <div className="o-unititem__title">Libero doloremque suscipit perferendis amet nostrum! Nostrum quisquam, tempore voluptatum ea dolor, hic esse adipisci reprehenderit ullam minima distinctio. Vero, molestias non.</div>
          <ul className="o-unititem__author">
            <li>Fung, Joe</li>
            <li>Wu, Abe</li>
            <li>Reed, Laura K</li>
            <li>Smith, Sheryl T</li>
            <li>Barshop, William</li>
            <li>Wong, Jeannette</li>
            <li>Dothager, Matthew</li>
            <li>Lee, Paul</li>
            <li>Wong, Jeannette</li>
          </ul>
        </a>

        <a href="" className="o-unititem--horz">
          <h3 className="o-unititem__type--multimedia">Multimedia</h3>
          <div className="o-unititem__title">Sapiente pariatur voluptatibus, quisquam quam libero aspernatur esse dolorem, nisi voluptate accusantium consectetur temporibus maiores quis tempore. Non, architecto eveniet a laudantium.</div>
          <ul className="o-unititem__author">
            <li>Fung, Joe</li>
            <li>Wu, Abe</li>
            <li>Reed, Laura K</li>
            <li>Smith, Sheryl T</li>
            <li>Barshop, William</li>
            <li>Wong, Jeannette</li>
            <li>Dothager, Matthew</li>
            <li>Lee, Paul</li>
            <li>Wong, Jeannette</li>
          </ul>
        </a>

      </div>
    )
  }
}

module.exports = UnitItemObj;
