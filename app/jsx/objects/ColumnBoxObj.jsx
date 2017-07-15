// ##### Column Box Objects ##### //

import React from 'react'
import $ from 'jquery'

// Load dotdotdot in browser but not server:
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class ColumnBoxObj extends React.Component {
  componentDidMount() {
    $(this.element).dotdotdot({
      watch: 'window',
      after: '.o-columnbox__truncate-more',
      callback: ()=> $(this.element).find(".o-columnbox__truncate-more").click(this.destroydotdotdot)
    });
    setTimeout(()=> $(this.element).trigger('update'), 0) // removes 'more' link upon page load if less than truncation threshold
  }
  destroydotdotdot = event => {
    $(this.element).trigger('destroy')
    $(this.element).removeClass("o-columnbox__truncate1")
  }
  render() {
    return (
      <div>
        
        <h2>Column Boxes 1</h2>
        <section className="o-columnbox1">
          <header>
            <h2>About eScholarship</h2>
          </header>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
        </section>
        <section className="o-columnbox1">
          <header>
            <h2>About eScholarship</h2>
          </header>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
        </section>

        <h3>Truncated to 5 lines</h3>
        <section className="o-columnbox1">
          <header>
            <h2>About eScholarship</h2>
          </header>
          <div className="o-columnbox__truncate1" ref={element => this.element = element}>
            <div> {/* this element (or any child) required so that 'more' link goes away at less than truncation threshold */}
              Harum, esse, magni. Repudiandae fugiat ab earum dignissimos veniam quae enim nesciunt deleniti deserunt. Numquam commodi sunt autem dolore repellendus, minus quae modi natus dignissimos. Repellendus, expedita quos doloremque neque asperiores voluptates atque? Aliquam vel quae hic nostrum sint illum, alias soluta rerum at consectetur, eaque nemo nulla sed officia labore illo magni nisi suscipit libero reiciendis. Illo esse a commodi aperiam sequi voluptatibus doloremque eaque cum id. Harum excepturi, fuga molestiae, sunt aperiam recusandae odit! Laborum, voluptas quos. Corporis mollitia itaque perspiciatis, nulla odio incidunt ex maxime, delectus repellat illo nisi eos quas quam doloribus aliquid nesciunt, fugit totam minima neque? Iure, necessitatibus maxime porro, non cum iusto. <button className="o-columnbox__truncate-more">More</button>
            </div>
          </div>
        </section>

        <h3>When Placed Within Sidebar</h3>
        <aside>
          <section className="o-columnbox1">
            <header>
              <h2>About eScholarship</h2>
            </header>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
          </section>
          <section className="o-columnbox1">
            <header>
              <h2>About eScholarship</h2>
            </header>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
          </section>
        </aside>

        <h2>Column Box 1 Without Section Header</h2>
        <section className="o-columnbox1">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
        </section>

        <h3>When Placed Within Sidebar</h3>
        <aside>
          <section className="o-columnbox1">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
          </section>
        </aside>

        <h2>Column Box 2 (Column Box 1 Without Background and Box Shadow)</h2>
        <section className="o-columnbox2">
          <header>
            <h2>About eScholarship</h2>
          </header>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
        </section>

        <h3>When Placed Within Sidebar</h3>
        <aside>
          <section className="o-columnbox2">
            <header>
              <h2>About eScholarship</h2>
            </header>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
          </section>
        </aside>

      </div>
    )
  }
}

module.exports = ColumnBoxObj;
