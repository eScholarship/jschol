// ##### Column Box Objects ##### //

import React from 'react'

class ColumnBoxObj extends React.Component {
  render() {
    return (
      <div>
        <h2>Column 1 Box</h2>
        <section className="o-columnbox1">
          <header>
            <h2 className="o-columnbox1__heading">About eScholarship</h2>
          </header>
          <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
          </p>
        </section>
        <h2>Column 2 Box</h2>
        <section className="o-columnbox2">
          <header>
            <h2 className="o-columnbox2__heading">Placeholder Title</h2>
          </header>
          <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
          </p>
        </section>
        <h2>Column 1 Box Divided</h2>
        <section className="o-columnbox1">
          <header>
            <h2 className="o-columnbox1__heading">About eScholarship</h2>
          </header>
          <div className="o-columnbox__divided">
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eaque similique aperiam recusandae quisquam deserunt soluta laudantium nemo dignissimos eum autem qui tenetur veniam, ducimus nobis maxime id eveniet, laborum, amet.
            </p>
            <p>Quia, tempore quis vitae a dolore! Accusantium eveniet fuga architecto ratione, nemo facere labore, repellat illo porro, harum amet. Cum voluptates commodi at facere doloribus, eos, saepe libero obcaecati nesciunt.
            </p>
            <p>Consectetur et, excepturi minima hic vero numquam. Alias nulla sunt culpa accusantium distinctio enim maxime, quis ratione consectetur delectus omnis suscipit atque asperiores nemo in molestiae similique quos autem pariatur?
            </p>
            <img src="http://placehold.it/300x150?text=Image" alt="" className="c-columndivide__img"/>
            <p>Nisi excepturi error molestias, accusamus quas non minima nam quis. Et blanditiis minima, consequatur error quibusdam maxime autem repellat id soluta ab saepe quos qui at vel ducimus voluptatem dolorem.
            </p>
          </div>
        </section>
        <h2>Column 1 Box Without Section Header</h2>
        <section className="o-columnbox1">
          <div>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quod tempora reiciendis odit. Ducimus similique nulla aliquam praesentium. Pariatur, accusamus deserunt, tempore voluptates ducimus vitae quod, distinctio similique tempora ipsum repellat.
          </div>
        </section>
        <h2>Column 2 Box Without Section Header</h2>
        <section className="o-columnbox2">
          <div>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Incidunt quasi molestiae praesentium at dignissimos inventore in, error! Temporibus, facere sed fuga sapiente expedita ab, quos ipsam obcaecati in cupiditate maxime?
          </div>
        </section>
        <h2>Stacked Column 2 Boxes</h2>
        <section className="o-columnbox2">
          <header>
            <h2 className="o-columnbox2__heading">Placeholder Title</h2>
          </header>
          <div>Eaque odit consequuntur voluptas quod quos voluptatum cupiditate! Veritatis fugit necessitatibus, deleniti, fuga sit earum consequuntur repellat, molestias facere illum illo laborum!
          </div>
        </section>
        <section className="o-columnbox2">
          <header>
            <h2 className="o-columnbox2__heading">Placeholder Title</h2>
          </header>
          <div>Quaerat aspernatur, commodi magni nisi, nulla aliquam iste quia, dolore consequatur nihil similique neque maxime, iure eligendi dolores repellendus numquam officiis fugit!
          </div>
        </section>
        <h2>Column 3 Box (Column 1 Box without Background and Shadow)</h2>
        <section className="o-columnbox3">
          <header>
            <h2 className="o-columnbox1__heading">Placeholder Title</h2>
          </header>
          <div>Obcaecati ab alias culpa mollitia porro eos itaque ipsa necessitatibus earum libero recusandae, consequuntur quos molestias, dolorum cupiditate doloremque atque possimus esse.
          </div>
        </section>
        <h2>Column 4 Box (Column 2 Box without Background and Shadow)</h2>
        <section className="o-columnbox4">
          <header>
            <h2 className="o-columnbox2__heading">Placeholder Title</h2>
          </header>
          <div>Obcaecati ab alias culpa mollitia porro eos itaque ipsa necessitatibus earum libero recusandae, consequuntur quos molestias, dolorum cupiditate doloremque atque possimus esse.
          </div>
        </section>
      </div>
    )
  }
}

module.exports = ColumnBoxObj;
