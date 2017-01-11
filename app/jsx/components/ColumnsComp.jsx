// ##### Columns Layout Component ##### //

import React from 'react'

class ColumnsComp extends React.Component {
  render() {
    return (
      <div>
        <h2>Example Using Left Sidebar with Main Content</h2>
        <div className="c-columns">
           <aside>
            <h3>Left Sidebar</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos quo error expedita nobis modi a non, accusantium, ut at assumenda. Obcaecati sequi ducimus sint tenetur laboriosam alias corporis temporibus error?</p>
            <p>Nemo doloremque, possimus neque ea suscipit consectetur, ducimus ad veritatis laborum quia sunt modi accusamus pariatur sed. Blanditiis est, distinctio ad aut, quo doloremque voluptatibus consequatur ipsa placeat dolorum necessitatibus?</p>
          </aside>
          <main>
            <h3>Main Content</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Labore, saepe fugiat nihil molestias quam fugit harum suscipit, soluta debitis praesentium. Minus repudiandae debitis non dolore dignissimos, aliquam corporis ratione, quasi.</p>
            <p>Est itaque, expedita magnam voluptatem tempora quia odit quo natus labore! Deserunt libero culpa, sequi placeat nobis soluta aliquam. Quam cum itaque vero necessitatibus, aliquid saepe possimus. Esse laboriosam, voluptas.</p>
            <p>Minima a, ullam dignissimos beatae voluptatibus labore iure vero vitae blanditiis. Aliquid a at perspiciatis magnam facere harum totam molestias repellat nulla quis debitis, perferendis quaerat adipisci soluta ullam veniam.</p>
          </main>
        </div>

        <h2>Example Using Main Content with Right Sidebar</h2>

        <div className="c-columns">
          <main>
            <h3>Main Content</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Labore, saepe fugiat nihil molestias quam fugit harum suscipit, soluta debitis praesentium. Minus repudiandae debitis non dolore dignissimos, aliquam corporis ratione, quasi.</p>
            <p>Est itaque, expedita magnam voluptatem tempora quia odit quo natus labore! Deserunt libero culpa, sequi placeat nobis soluta aliquam. Quam cum itaque vero necessitatibus, aliquid saepe possimus. Esse laboriosam, voluptas.</p>
            <p>Minima a, ullam dignissimos beatae voluptatibus labore iure vero vitae blanditiis. Aliquid a at perspiciatis magnam facere harum totam molestias repellat nulla quis debitis, perferendis quaerat adipisci soluta ullam veniam.</p>
          </main>
          <aside>
            <h3>Right Sidebar</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deserunt inventore aut quibusdam impedit qui beatae. Expedita inventore dignissimos doloremque veniam quod iusto voluptas debitis. Eius dolores reiciendis accusantium, doloremque illo.
            </p>
            <p>Optio distinctio nemo numquam dolorem rerum quae eum, ipsum amet repudiandae, cum a quibusdam magnam praesentium nostrum quidem eaque maiores ipsam. Iste voluptate similique sapiente totam sit, minus numquam enim?
            </p>
          </aside>
        </div>

        <h2>Example Using Left and Right Sidebar with Main Content</h2>

        <div className="c-columns">
          <aside>
            <h3>Left Sidebar</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos quo error expedita nobis modi a non, accusantium, ut at assumenda. Obcaecati sequi ducimus sint tenetur laboriosam alias corporis temporibus error?</p>
            <p>Nemo doloremque, possimus neque ea suscipit consectetur, ducimus ad veritatis laborum quia sunt modi accusamus pariatur sed. Blanditiis est, distinctio ad aut, quo doloremque voluptatibus consequatur ipsa placeat dolorum necessitatibus?</p>
          </aside>
          <main>
            <h3>Main Content</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Labore, saepe fugiat nihil molestias quam fugit harum suscipit, soluta debitis praesentium. Minus repudiandae debitis non dolore dignissimos, aliquam corporis ratione, quasi.</p>
            <p>Est itaque, expedita magnam voluptatem tempora quia odit quo natus labore! Deserunt libero culpa, sequi placeat nobis soluta aliquam. Quam cum itaque vero necessitatibus, aliquid saepe possimus. Esse laboriosam, voluptas.</p>
            <p>Minima a, ullam dignissimos beatae voluptatibus labore iure vero vitae blanditiis. Aliquid a at perspiciatis magnam facere harum totam molestias repellat nulla quis debitis, perferendis quaerat adipisci soluta ullam veniam.</p>
          </main>
          <aside>
            <h3>Right Sidebar</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deserunt inventore aut quibusdam impedit qui beatae. Expedita inventore dignissimos doloremque veniam quod iusto voluptas debitis. Eius dolores reiciendis accusantium, doloremque illo.
            </p>
            <p>Optio distinctio nemo numquam dolorem rerum quae eum, ipsum amet repudiandae, cum a quibusdam magnam praesentium nostrum quidem eaque maiores ipsam. Iste voluptate similique sapiente totam sit, minus numquam enim?
            </p>
          </aside>
        </div>

      </div>
    )
  }
}

module.exports = ColumnsComp;
