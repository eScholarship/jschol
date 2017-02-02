// ##### Item Page - "Tab 1" Main Content Component ##### //

import React from 'react'
import ItemActionsComp from '../components/ItemActionsComp.jsx'
import AuthorListComp from '../components/AuthorListComp.jsx'
import PublishedLocationComp from '../components/PublishedLocationComp.jsx'

class TabContent1Comp extends React.Component {
  getLink = (id, service)=>  {
    $.getJSON("/api/mediaLink/"+id+"/"+service).done((data) => {
      window.location = data.url
    }).fail((jqxhr, textStatus, err)=> {
      console.log("Failed! textStatus=", textStatus, ", err=", err)
    })
  }

  render() {
    let p = this.props
        // pub_web_loc = p.attrs["pub_web_loc"].map(function(node, i) {
        //   return ( <span key={i}><a href={node}>{node}</a><br/></span> )
        // }),
        // abstr = p.attrs["abstract"]
    return (
      <div className="c-tabcontent">
        <ItemActionsComp />
        <h1 className="c-tabcontent__heading">From the New Heights: The City and Migrating Latinas in Real Women Have Curves and María Full of Grace</h1>
        <AuthorListComp />
        <PublishedLocationComp />
        <details className="c-togglecontent" open>
          <summary><h2>Abstract</h2></summary>
          <p>Eum nihil quidem nisi sapiente vel obcaecati esse vero placeat! Dicta fugiat quam, nemo accusamus cum, non voluptas sit eveniet. Voluptates odio consectetur eum dicta vel at rerum accusamus inventore officiis, voluptate deleniti et reiciendis aliquam illo eaque laborum neque excepturi pariatur unde obcaecati molestiae dolores voluptas non earum minima.</p>
          <p className="c-well">Libero dolores rerum nesciunt deserunt incidunt, aspernatur similique fugit beatae quis impedit corrupti, voluptate, unde facilis. Voluptatibus labore sunt maxime, accusantium animi mollitia ducimus.</p>
        </details>
        <details className="c-togglecontent" open>
          <summary><h2>Main Content</h2></summary>
          <p>Fugit dignissimos, laborum repudiandae consequuntur, sit iure nobis animi numquam laudantium error veniam incidunt in at, nihil doloremque labore, odio illo cumque debitis vel enim rerum possimus saepe blanditiis. Temporibus ducimus rerum quidem ipsa quas asperiores, sapiente in, delectus quae excepturi dolor officiis at quia fugit minus vitae libero. Voluptas quos nobis unde sequi laborum ipsam similique placeat, mollitia debitis provident, consequuntur, blanditiis ducimus! Blanditiis quibusdam ab aspernatur, repellendus recusandae, dolor quidem ipsa id laborum inventore illum eligendi laboriosam necessitatibus nam labore, pariatur delectus corporis suscipit amet asperiores soluta doloremque iste voluptate.</p>
          <div className="o-dividecontent2x">
            <img className="o-imagecontent" src="http://placehold.it/250x150?text=Placeholder" alt="" />
            <img className="o-imagecontent" src="http://placehold.it/250x150?text=Placeholder" alt=""/>
          </div>
          <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptatum ratione dolorum obcaecati impedit accusantium delectus quasi quis numquam consequuntur, aspernatur! Ut, consequuntur voluptates incidunt molestiae temporibus ullam laboriosam mollitia quidem. Alias, praesentium, deserunt. Architecto eos amet vero perferendis repellendus laboriosam, cum totam aspernatur, vel, iste maiores atque eligendi autem ipsam!
          </p>
        </details>
      </div>
    )
  }
}

module.exports = TabContent1Comp;
