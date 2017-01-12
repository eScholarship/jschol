// ##### Scholarly Works Component ##### //

import React from 'react'
import $ from 'jquery'
import dotdotdot from 'jquery.dotdotdot'

class ScholWorksComp extends React.Component {
  componentDidMount() {
    $('.c-scholworks__heading, .c-scholworks__author, .c-scholworks__abstract').dotdotdot({watch:"window"});
  }
  render() {
    return (
      <section className="c-scholworks">
        <div className="c-scholworks__main-column">
          <ul className="c-scholworks__tag-list">
            <li className="c-scholworks__tag-article">Article</li>
            <li className="c-scholworks__tag-peer">Peer Reviewed</li>
          </ul>
          <heading>
            <h2 className="c-scholworks__heading">
              <a href="">From the New Heights: The City and Migrating Latinas in Real Woman Have Curves and Maria Full of Grace</a>
            </h2 >
          </heading>
          <div className="c-scholworks__author">
            <a href="">Dahle, Kevin W</a>; <a href="">Pelfrey, Patricia A</a>; <a href="">Walker, Iain S</a>; <a href="">Kling, Rob</a>; <a href="">Huh, Tina</a>
          </div>
          <div className="c-scholworks__publication">
            <a href="">Mester Journal, Volume 42, Issue 1</a> (2012)
          </div>
          <div className="c-scholworks__abstract">
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. A, dolor obcaecati magni quas quos ab dignissimos neque beatae, provident unde architecto ut corrupti! Ratione aperiam, recusandae quidem nisi inventore asperiores nam sed eaque totam, quam minima reprehenderit, quisquam cupiditate reiciendis. Vero earum magni asperiores quisquam impedit voluptates eveniet aspernatur assumenda.
            </p>
          </div>
          <div className="c-scholworks__media">
            <ul className="c-scholworks__media-list">
              <li className="c-scholworks__media-video">Contains 5 videos</li>
              <li className="c-scholworks__media-image">Contains 2 images</li>
              <li className="c-scholworks__media-pdf">Contains 2 additional PDFs</li>
              <li className="c-scholworks__media-audio">Contains 5 audio files</li>
            </ul>
            <img className="c-scholworks__rights" src="images/icon_cc-by.svg" alt="cc"/>
          </div>
        </div>
        <img className="c-scholworks__article-preview" src="images/temp_article.png" alt="article"/>
      </section>
    )
  }
}

module.exports = ScholWorksComp;
