// ##### About Layout ##### //

import React from 'react'
import Header2Comp from '../components/Header2Comp.jsx'
import Subheader2Comp from '../components/Subheader2Comp.jsx'
import NavBarComp from '../components/NavBarComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import MarqueeComp from '../components/MarqueeComp.jsx'
import FrontmatterComp from '../components/FrontmatterComp.jsx'
import JournalInfoComp from '../components/JournalInfoComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class JournalSplashyLayout extends React.Component {
  render() {
    return (
      <div className="l-about">
        <a href="#maincontent" className="c-skipnav">Skip to main content</a>
        <Header2Comp />
        <Subheader2Comp />
        <NavBarComp />
        <BreadcrumbComp />
        <MarqueeComp />
        <div className="c-columns">
          <main id="maincontent">
            <section className="o-columnbox1">
              <FrontmatterComp />
              <h3>Table of Contents</h3>
              <div className="o-dividecontent2x--ruled">
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eaque similique aperiam recusandae quisquam deserunt soluta laudantium nemo dignissimos eum autem qui tenetur veniam, ducimus nobis maxime id eveniet, laborum, amet.
                </p>
                <p>Quia, tempore quis vitae a dolore! Accusantium eveniet fuga architecto ratione, nemo facere labore, repellat illo porro, harum amet. Cum voluptates commodi at facere doloribus, eos, saepe libero obcaecati nesciunt.
                </p>
                <p>Consectetur et, excepturi minima hic vero numquam. Alias nulla sunt culpa accusantium distinctio enim maxime, quis ratione consectetur delectus omnis suscipit atque asperiores nemo in molestiae similique quos autem pariatur?
                </p>
                <img className="o-imagecontent" src="http://placehold.it/300x150?text=Image" alt="" />
                <p>Nisi excepturi error molestias, accusamus quas non minima nam quis. Et blanditiis minima, consequatur error quibusdam maxime autem repellat id soluta ab saepe quos qui at vel ducimus voluptatem dolorem.
                </p>
              </div>
            </section>
          </main>
          <aside>
            <section className="o-columnbox2">
              <header>
                <h2>Journal Information</h2>
              </header>
              <JournalInfoComp />
            </section>
            <section className="o-columnbox2">
              <header>
                <h2>Featured Articles</h2>
                </header>
                <p><a className="o-textlink__secondary" href="">Entre la ficción y el periodismo: Cambio social y la crónica mexicana contemporánea</a> <br/> Nadeau, Evelyn</p> 
                <p><a className="o-textlink__secondary" href="">Journalism in Catalonia During Francoism</a> <br/> Reguant, Monserrat</p>
                <p><a className="o-textlink__secondary" href="">En torno a un cuento olvidado de Clarín: "El oso mayor"</a> <br/> Gil, Angeles Ezama</p>
                <p><a className="o-textlink__secondary" href="">Interview with Guillermo Cabrera Infante</a> <br/> Graham-Jones, Jean; Deosthale, Duleep</p>
                <p><a className="o-textlink__secondary" href="">Lazlo Moussong. Castillos en la letra. Xalapa, México: Universidad Veracruzana, 1986.</a> <br/> Radchik, Laura</p>
            </section>
            <section className="o-columnbox2">
              <header>
                <h2>Follow us on Twitter</h2>
              </header>
              [content to go here]
            </section>
          </aside>
        </div>
        <FooterComp />
      </div>
    )
  }
}

module.exports = JournalSplashyLayout;
