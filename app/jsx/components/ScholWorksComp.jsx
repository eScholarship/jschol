// ##### Scholarly Works Component ##### //

import React from 'react'

class ScholWorksComp extends React.Component {
  render() {
		return (
			<div className="c-scholworks">
				<section className="c-scholworks__item">
					<div className="c-scholworks__main-column">
						<ul className="c-scholworks__tag-list">
							<li className="c-scholworks__tag-article">Article</li>
							<li className="c-scholworks__tag-peer">Peer Reviewed</li>
						</ul>
						<header>
							<a href="">From the New Heights: The City and Migrating Latinas in Real Woman Have Curves and Maria Full of Grace</a>
						</header>
						<p>Dahle, Kevin W: Pelfrey, Patricia A; Walker, Iain S; Kling, Rob; Huh, Tina <br/>
						<a className="c-scholworks__institution-link" href="">Mester Journal, Volume 42, Issue 1</a> (2012)</p>
						<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eum esse ea laboriosam modi! Distinctio itaque rerum totam, architecto ad dolor et, repudiandae ipsum tempora voluptatem praesentium quaerat quod, nihil consectetur.
						</p>
						<div className="c-scholworks__media">
							<ul className="c-scholworks__media-list">
								<li className="c-scholworks__media-video">Contains 5 videos</li>
								<li className="c-scholworks__media-image">Contains 2 images</li>
								<li className="c-scholworks__media-pdf">Contains 2 additional PDFs</li>
								<li className="c-scholworks__media-audio">Contains 5 audio files</li>
							</ul>
							<img className="c-scholworks__cc" src="images/icon_cc-by.svg" alt="cc"/>
						</div>
					</div>
					<img className="c-scholworks__article-preview" src="images/temp_article.png" alt="article"/>
				</section>
			</div>
		)
	}
}

module.exports = ScholWorksComp;
